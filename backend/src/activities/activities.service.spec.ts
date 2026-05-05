import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ActivitiesService } from './activities.service';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let model: Model<ActivityDocument>;

  // Mock data
  const mockObjectId = new Types.ObjectId();
  const mockActivity = {
    _id: mockObjectId,
    title: 'Formation TypeScript',
    description: 'Formation avancée en TypeScript',
    departmentId: 'dept-123',
    type: 'formation',
    requiredSkills: [
      { skill_name: 'JavaScript', desired_level: 'intermediate' },
      { skill_name: 'TypeScript', desired_level: 'beginner' }
    ],
    maxParticipants: 20,
    startDate: new Date('2024-06-01T09:00:00Z'),
    endDate: new Date('2024-06-01T17:00:00Z'),
    location: 'Salle de formation A',
    status: 'draft',
    completed: false,
    post_activity_updated: false,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockCreateActivityDto: CreateActivityDto = {
    title: 'Formation TypeScript',
    description: 'Formation avancée en TypeScript',
    departmentId: 'dept-123',
    type: 'formation',
    requiredSkills: [
      { skill_name: 'JavaScript', desired_level: 'intermediate' },
      { skill_name: 'TypeScript', desired_level: 'beginner' }
    ],
    maxParticipants: 20,
    startDate: new Date('2024-06-01T09:00:00Z'),
    endDate: new Date('2024-06-01T17:00:00Z'),
    location: {
      lat: 48.8566,
      lng: 2.3522,
      address: 'Paris, France'
    }
  };

  const mockUpdateActivityDto: UpdateActivityDto = {
    title: 'Formation TypeScript Avancée',
    description: 'Formation très avancée en TypeScript',
    maxParticipants: 25,
    status: 'published'
  };

  // Mock du modèle Mongoose
  const mockActivityModel = jest.fn().mockImplementation((dto) => ({
    ...mockActivity,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockActivity, ...dto }),
  }));

  // Ajouter les méthodes statiques
  mockActivityModel.find = jest.fn();
  mockActivityModel.findById = jest.fn();
  mockActivityModel.findByIdAndUpdate = jest.fn();
  mockActivityModel.findByIdAndDelete = jest.fn();
  mockActivityModel.create = jest.fn();
  mockActivityModel.exec = jest.fn();
  mockActivityModel.sort = jest.fn().mockReturnThis();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getModelToken(Activity.name),
          useValue: mockActivityModel,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    model = module.get<Model<ActivityDocument>>(getModelToken(Activity.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new activity successfully', async () => {
      const result = await service.create(mockCreateActivityDto);

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...mockCreateActivityDto,
        location: 'Paris, France', // Location convertie en string
      });
      expect(result).toBeDefined();
    });

    it('should convert location object to string (address)', async () => {
      const dtoWithLocation = {
        ...mockCreateActivityDto,
        location: { lat: 48.8566, lng: 2.3522, address: 'Test Address' }
      };

      await service.create(dtoWithLocation);

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...dtoWithLocation,
        location: 'Test Address',
      });
    });

    it('should convert location object to coordinates string when no address', async () => {
      const dtoWithCoords = {
        ...mockCreateActivityDto,
        location: { lat: 48.8566, lng: 2.3522 }
      };

      await service.create(dtoWithCoords);

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...dtoWithCoords,
        location: '48.8566,2.3522',
      });
    });

    it('should handle string location', async () => {
      const dtoWithStringLocation = {
        ...mockCreateActivityDto,
        location: 'String Location'
      };

      await service.create(dtoWithStringLocation as any);

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...dtoWithStringLocation,
        location: 'String Location',
      });
    });

    it('should handle undefined location', async () => {
      const dtoWithoutLocation = {
        ...mockCreateActivityDto,
        location: undefined
      };

      await service.create(dtoWithoutLocation);

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...dtoWithoutLocation,
        location: undefined,
      });
    });
  });

  describe('findAll', () => {
    it('should return all activities sorted by startDate descending', async () => {
      const mockActivities = [mockActivity, { ...mockActivity, _id: new Types.ObjectId() }];
      mockActivityModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockActivities),
      });

      const result = await service.findAll();

      expect(mockActivityModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockActivities);
    });

    it('should return empty array when no activities found', async () => {
      mockActivityModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return activity by valid ID', async () => {
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const result = await service.findOne(mockObjectId.toString());

      expect(mockActivityModel.findById).toHaveBeenCalledWith(mockObjectId.toString());
      expect(result).toEqual(mockActivity);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(invalidId)).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      const validId = new Types.ObjectId().toString();
      mockActivityModel.findById.mockResolvedValue(null);

      await expect(service.findOne(validId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(validId)).rejects.toThrow('Activité non trouvée');
    });
  });

  describe('update', () => {
    it('should update activity successfully', async () => {
      const updatedActivity = { ...mockActivity, ...mockUpdateActivityDto };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(updatedActivity);

      const result = await service.update(mockObjectId.toString(), mockUpdateActivityDto);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockObjectId.toString(),
        mockUpdateActivityDto,
        { new: true }
      );
      expect(result).toEqual(updatedActivity);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.update(invalidId, mockUpdateActivityDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(invalidId, mockUpdateActivityDto)).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      const validId = new Types.ObjectId().toString();
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update(validId, mockUpdateActivityDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(validId, mockUpdateActivityDto)).rejects.toThrow('Activité non trouvée');
    });

    it('should convert location object to string when updating', async () => {
      const updateDtoWithLocation = {
        ...mockUpdateActivityDto,
        location: { lat: 45.7640, lng: 4.8357, address: 'Lyon, France' }
      };
      const updatedActivity = { ...mockActivity, ...updateDtoWithLocation };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(updatedActivity);

      await service.update(mockObjectId.toString(), updateDtoWithLocation as any);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockObjectId.toString(),
        {
          ...updateDtoWithLocation,
          location: 'Lyon, France',
        },
        { new: true }
      );
    });

    it('should handle location coordinates without address', async () => {
      const updateDtoWithCoords = {
        ...mockUpdateActivityDto,
        location: { lat: 45.764, lng: 4.8357 }
      };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(mockActivity);

      await service.update(mockObjectId.toString(), updateDtoWithCoords as any);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockObjectId.toString(),
        {
          ...updateDtoWithCoords,
          location: '45.764,4.8357',
        },
        { new: true }
      );
    });

    it('should not modify location when not provided in update', async () => {
      const updateDtoWithoutLocation = {
        title: 'Updated Title',
        description: 'Updated Description'
      };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(mockActivity);

      await service.update(mockObjectId.toString(), updateDtoWithoutLocation);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockObjectId.toString(),
        updateDtoWithoutLocation,
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should delete activity successfully', async () => {
      mockActivityModel.findByIdAndDelete.mockResolvedValue(mockActivity);

      const result = await service.remove(mockObjectId.toString());

      expect(mockActivityModel.findByIdAndDelete).toHaveBeenCalledWith(mockObjectId.toString());
      expect(result).toEqual({ message: 'Activité supprimée avec succès' });
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.remove(invalidId)).rejects.toThrow(BadRequestException);
      await expect(service.remove(invalidId)).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      const validId = new Types.ObjectId().toString();
      mockActivityModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(validId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(validId)).rejects.toThrow('Activité non trouvée');
    });
  });

  describe('locationToString helper function', () => {
    it('should handle various location formats', async () => {
      // Test avec objet complexe
      const complexLocation = {
        lat: 48.8566,
        lng: 2.3522,
        address: 'Paris',
        extra: 'data'
      };

      await service.create({
        ...mockCreateActivityDto,
        location: complexLocation
      });

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...mockCreateActivityDto,
        location: 'Paris',
      });
    });

    it('should convert non-object location to string', async () => {
      await service.create({
        ...mockCreateActivityDto,
        location: 123 as any
      });

      expect(mockActivityModel).toHaveBeenCalledWith({
        ...mockCreateActivityDto,
        location: '123',
      });
    });
  });
});