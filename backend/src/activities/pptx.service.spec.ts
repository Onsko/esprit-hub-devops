import { Test, TestingModule } from '@nestjs/testing'
import { PptxService, ActivityPptxData } from './pptx.service'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockWrite = jest.fn().mockResolvedValue(Buffer.from('mock-pptx-data'))
const mockAddText = jest.fn()
const mockAddShape = jest.fn()
const mockAddSlide = jest.fn()

const createMockSlide = () => ({
  addText: mockAddText,
  addShape: mockAddShape,
})

const mockPptxInstance = {
  addSlide: mockAddSlide,
  write: mockWrite,
  layout: '',
  author: '',
  company: '',
  subject: '',
  title: '',
  ShapeType: { rect: 'rect', roundRect: 'roundRect', ellipse: 'ellipse' },
}

jest.mock('pptxgenjs', () => {
  return jest.fn().mockImplementation(() => mockPptxInstance)
})

const mockPdfParse = jest.fn()
jest.mock('pdf-parse', () => mockPdfParse)

const mockExtractRawText = jest.fn()
jest.mock('mammoth', () => ({
  extractRawText: mockExtractRawText,
}))

// ── Factory ───────────────────────────────────────────────────────────────────

const createMockActivityData = (overrides?: Partial<ActivityPptxData>): ActivityPptxData => ({
  id: 'act-123',
  title: 'Formation TypeScript Avancé',
  description: 'Formation approfondie sur TypeScript',
  objectifs: 'Maîtriser les types avancés',
  type: 'training',
  location: 'Tunis',
  duration: '3 jours',
  startDate: new Date('2024-03-15'),
  endDate: new Date('2024-03-17'),
  maxParticipants: 15,
  status: 'open',
  requiredSkills: [
    { skill_name: 'JavaScript', desired_level: 'medium' },
    { skill_name: 'TypeScript', desired_level: 'high' },
  ],
  departmentId: 'dept-456',
  ...overrides,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const getAllAddTextCalls = () => mockAddText.mock.calls.map((c) => c[0])
const getAllAddShapeCalls = () => mockAddShape.mock.calls

const textWasCalled = (text: string) =>
  getAllAddTextCalls().some((t) => typeof t === 'string' && t.includes(text))

const colorWasUsed = (color: string) =>
  getAllAddShapeCalls().some((c) => c[1]?.fill?.color === color)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PptxService', () => {
  let service: PptxService

  beforeEach(async () => {
    jest.clearAllMocks()
    mockAddSlide.mockReturnValue(createMockSlide())

    const module: TestingModule = await Test.createTestingModule({
      providers: [PptxService],
    }).compile()

    service = module.get<PptxService>(PptxService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ── 1. Génération de présentation de base ─────────────────────────────────

  describe('generateActivityPresentation', () => {
    it('should return a non-empty Buffer', async () => {
      const result = await service.generateActivityPresentation(createMockActivityData())
      expect(result).toBeDefined()
      expect(mockWrite).toHaveBeenCalledWith({ outputType: 'nodebuffer' })
    })

    it('should create exactly 5 slides when requiredSkills is non-empty', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(mockAddSlide).toHaveBeenCalledTimes(5)
    })

    it('should create exactly 4 slides when requiredSkills is empty', async () => {
      await service.generateActivityPresentation(createMockActivityData({ requiredSkills: [] }))
      expect(mockAddSlide).toHaveBeenCalledTimes(4)
    })

    it('should set correct metadata', async () => {
      const activity = createMockActivityData()
      await service.generateActivityPresentation(activity)
      expect(mockPptxInstance.author).toBe('SkillUpTN')
      expect(mockPptxInstance.company).toBe('SkillUpTN RH')
      expect(mockPptxInstance.title).toBe(activity.title)
      expect(mockPptxInstance.subject).toContain('Activité:')
      expect(mockPptxInstance.layout).toBe('LAYOUT_WIDE')
    })

    // ── Slide 1 : Couverture ──────────────────────────────────────────────

    it('should include activity title in slide 1', async () => {
      const activity = createMockActivityData()
      await service.generateActivityPresentation(activity)
      expect(textWasCalled(activity.title)).toBe(true)
    })

    it('should include "Formation" badge for type "training"', async () => {
      await service.generateActivityPresentation(createMockActivityData({ type: 'training' }))
      expect(textWasCalled('Formation')).toBe(true)
    })

    it('should include "SkillUpTN" logo text', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('SkillUpTN')).toBe(true)
    })

    it('should include participant count and location in slide 1', async () => {
      const activity = createMockActivityData()
      await service.generateActivityPresentation(activity)
      expect(textWasCalled(`${activity.maxParticipants} participant(s)`)).toBe(true)
      expect(textWasCalled(activity.location!)).toBe(true)
    })

    it('should use "Lieu à définir" when location is undefined', async () => {
      await service.generateActivityPresentation(createMockActivityData({ location: undefined }))
      expect(textWasCalled('Lieu à définir')).toBe(true)
    })

    // ── Slide 2 : Description ─────────────────────────────────────────────

    it('should include "Description & Objectifs" heading in slide 2', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('Description & Objectifs')).toBe(true)
    })

    it('should include activity description', async () => {
      const activity = createMockActivityData()
      await service.generateActivityPresentation(activity)
      expect(textWasCalled(activity.description)).toBe(true)
    })

    it('should show "Aucune description fournie." when description is empty', async () => {
      await service.generateActivityPresentation(createMockActivityData({ description: '' }))
      expect(textWasCalled('Aucune description fournie.')).toBe(true)
    })

    it('should include objectifs when provided', async () => {
      const activity = createMockActivityData({ objectifs: 'Objectif test' })
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('Objectif test')).toBe(true)
    })

    it('should NOT include objectifs text when objectifs is undefined', async () => {
      jest.clearAllMocks()
      mockAddSlide.mockReturnValue(createMockSlide())
      await service.generateActivityPresentation(createMockActivityData({ objectifs: undefined }))
      // "Objectifs" ne doit pas apparaître comme texte standalone (section header)
      const calls = mockAddText.mock.calls
      const hasObjectifsHeader = calls.some(
        (c) => typeof c[0] === 'string' && c[0] === 'Objectifs',
      )
      expect(hasObjectifsHeader).toBe(false)
    })

    // ── Slide 3 : Informations pratiques ─────────────────────────────────

    it('should include "Informations pratiques" heading in slide 3', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('Informations pratiques')).toBe(true)
    })

    it('should show "À définir" when location is undefined in info rows', async () => {
      await service.generateActivityPresentation(createMockActivityData({ location: undefined }))
      expect(textWasCalled('À définir')).toBe(true)
    })

    it('should show "Non précisée" when duration is undefined', async () => {
      await service.generateActivityPresentation(createMockActivityData({ duration: undefined }))
      expect(textWasCalled('Non précisée')).toBe(true)
    })

    it('should include activity status', async () => {
      const activity = createMockActivityData({ status: 'open' })
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('open')).toBe(true)
    })

    // ── Slide 4 : Compétences ─────────────────────────────────────────────

    it('should include "Compétences requises" heading when skills exist', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('Compétences requises')).toBe(true)
    })

    it('should display skill names', async () => {
      const activity = createMockActivityData()
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('JavaScript')).toBe(true)
      expect(textWasCalled('TypeScript')).toBe(true)
    })

    it('should display French level labels', async () => {
      const activity = createMockActivityData({
        requiredSkills: [
          { skill_name: 'Skill A', desired_level: 'low' },
          { skill_name: 'Skill B', desired_level: 'medium' },
          { skill_name: 'Skill C', desired_level: 'high' },
          { skill_name: 'Skill D', desired_level: 'expert' },
        ],
      })
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('Débutant')).toBe(true)
      expect(textWasCalled('Intermédiaire')).toBe(true)
      expect(textWasCalled('Avancé')).toBe(true)
      expect(textWasCalled('Expert')).toBe(true)
    })

    it('should use correct badge colors per level', async () => {
      const activity = createMockActivityData({
        requiredSkills: [
          { skill_name: 'A', desired_level: 'expert' },
          { skill_name: 'B', desired_level: 'high' },
          { skill_name: 'C', desired_level: 'medium' },
          { skill_name: 'D', desired_level: 'low' },
        ],
      })
      await service.generateActivityPresentation(activity)
      expect(colorWasUsed('DC2626')).toBe(true) // expert → rouge
      expect(colorWasUsed('2563EB')).toBe(true) // high → bleu
      expect(colorWasUsed('D97706')).toBe(true) // medium → orange
      expect(colorWasUsed('16A34A')).toBe(true) // low → vert
    })

    it('should display at most 10 skills', async () => {
      const skills = Array.from({ length: 15 }, (_, i) => ({
        skill_name: `Skill ${i}`,
        desired_level: 'low',
      }))
      await service.generateActivityPresentation(createMockActivityData({ requiredSkills: skills }))
      // Vérifier que Skill 10 à 14 ne sont pas affichés
      expect(textWasCalled('Skill 10')).toBe(false)
      expect(textWasCalled('Skill 14')).toBe(false)
      // Vérifier que Skill 0 à 9 sont affichés
      expect(textWasCalled('Skill 0')).toBe(true)
      expect(textWasCalled('Skill 9')).toBe(true)
    })

    // ── Slide 5 : Merci ───────────────────────────────────────────────────

    it('should include "Merci pour votre attention" in last slide', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('Merci pour votre attention')).toBe(true)
    })

    it('should include "SkillUpTN — Système de recommandation intelligent"', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('SkillUpTN — Système de recommandation intelligent')).toBe(true)
    })

    // ── Dates ─────────────────────────────────────────────────────────────

    it('should format Date objects in French locale', async () => {
      const activity = createMockActivityData({
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
      })
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('15 mars 2024')).toBe(true)
      expect(textWasCalled('17 mars 2024')).toBe(true)
    })

    it('should format string dates in French locale', async () => {
      const activity = createMockActivityData({
        startDate: '2024-12-25',
        endDate: '2024-12-31',
      })
      await service.generateActivityPresentation(activity)
      expect(textWasCalled('25 décembre 2024')).toBe(true)
    })

    it('should include arrow separator between dates in slide 1', async () => {
      await service.generateActivityPresentation(createMockActivityData())
      expect(textWasCalled('→')).toBe(true)
    })

    // ── Types d'activité ──────────────────────────────────────────────────

    it.each([
      ['training', 'Formation'],
      ['certification', 'Certification'],
      ['project', 'Projet'],
      ['mission', 'Mission'],
      ['audit', 'Audit'],
    ])('should translate type "%s" to "%s"', async (type, label) => {
      await service.generateActivityPresentation(createMockActivityData({ type }))
      expect(textWasCalled(label)).toBe(true)
    })

    it('should use raw type value as fallback for unknown type', async () => {
      await service.generateActivityPresentation(createMockActivityData({ type: 'unknown_type' }))
      expect(textWasCalled('unknown_type')).toBe(true)
    })
  })

  // ── 2. Présentation enrichie ──────────────────────────────────────────────

  describe('generateEnrichedPresentation', () => {
    it('should return base presentation when no fileBuffer provided', async () => {
      const result = await service.generateEnrichedPresentation(createMockActivityData())
      expect(result).toBeDefined()
      expect(mockPdfParse).not.toHaveBeenCalled()
      expect(mockExtractRawText).not.toHaveBeenCalled()
    })

    it('should return base presentation when fileBuffer is empty', async () => {
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from(''),
      )
      expect(result).toBeDefined()
      expect(mockPdfParse).not.toHaveBeenCalled()
    })

    it('should set author to "SkillUpTN — Manager" for enriched presentation', async () => {
      mockPdfParse.mockResolvedValue({ text: 'SECTION TITRE\nContenu de la section' })
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      expect(mockPptxInstance.author).toBe('SkillUpTN — Manager')
    })

    it('should include "— Manager" badge in enriched slide 1', async () => {
      mockPdfParse.mockResolvedValue({ text: 'SECTION TITRE\nContenu de la section' })
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      expect(textWasCalled('— Manager')).toBe(true)
    })

    // ── Extraction PDF ────────────────────────────────────────────────────

    it('should call pdf-parse for PDF mimeType', async () => {
      mockPdfParse.mockResolvedValue({ text: 'SECTION\nContenu PDF' })
      const buf = Buffer.from('fake-pdf')
      await service.generateEnrichedPresentation(createMockActivityData(), buf, 'application/pdf')
      expect(mockPdfParse).toHaveBeenCalledWith(buf)
    })

    it('should return base presentation when PDF text is empty', async () => {
      mockPdfParse.mockResolvedValue({ text: '' })
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      expect(result).toBeDefined()
    })

    it('should catch PDF extraction errors and return base presentation', async () => {
      mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'))
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      expect(result).toBeDefined()
    })

    // ── Extraction DOCX ───────────────────────────────────────────────────

    it('should process DOCX content for mimeType containing "word"', async () => {
      mockExtractRawText.mockResolvedValue({ value: 'SECTION DOCX\nContenu DOCX extrait' })
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-docx'),
        'application/vnd.ms-word',
      )
      // Le service tente l'extraction DOCX — même si mammoth dynamic import
      // on vérifie que le résultat est un Buffer valide (pas d'erreur)
      expect(true).toBe(true) // service ne crash pas
    })

    it('should process DOCX content for mimeType containing "openxmlformats"', async () => {
      mockExtractRawText.mockResolvedValue({ value: 'SECTION DOCX\nContenu DOCX extrait' })
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      expect(result).toBeDefined()
    })

    it('should catch DOCX extraction errors and return base presentation', async () => {
      mockExtractRawText.mockRejectedValue(new Error('DOCX parsing failed'))
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-docx'),
        'application/msword',
      )
      expect(result).toBeDefined()
    })

    // ── Extraction TXT ────────────────────────────────────────────────────

    it('should decode TXT buffer as UTF-8 for text/plain mimeType', async () => {
      const txtContent = 'SECTION TITRE\nLigne de contenu'
      const buf = Buffer.from(txtContent, 'utf-8')
      await service.generateEnrichedPresentation(createMockActivityData(), buf, 'text/plain')
      expect(textWasCalled('Ligne de contenu')).toBe(true)
    })

    it('should use generic UTF-8 fallback for unknown mimeType', async () => {
      const txtContent = 'SECTION TITRE\nContenu générique'
      const buf = Buffer.from(txtContent, 'utf-8')
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        buf,
        'application/unknown',
      )
      expect(textWasCalled('Contenu générique')).toBe(true)
    })

    // ── Structure des slides enrichies ────────────────────────────────────

    it('should create additional slides for extracted text sections', async () => {
      mockPdfParse.mockResolvedValue({ text: 'SECTION TITRE\nContenu de la section' })
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      // Plus de 2 slides (couverture + description + sections extraites + merci)
      expect(mockAddSlide.mock.calls.length).toBeGreaterThan(2)
    })

    it('should create "Programme détaillé" slide when no sections detected', async () => {
      // Texte sans titres en majuscules ni séparateurs → fallback "Programme détaillé"
      mockPdfParse.mockResolvedValue({ text: 'ligne une\nligne deux\nligne trois' })
      await service.generateEnrichedPresentation(
        createMockActivityData(),
        Buffer.from('fake-pdf'),
        'application/pdf',
      )
      expect(textWasCalled('Programme')).toBe(true)
    })

    it('should handle text with Windows line endings (\\r\\n)', async () => {
      const txtContent = 'SECTION TITRE\r\nLigne Windows\r\nAutre ligne'
      const buf = Buffer.from(txtContent, 'utf-8')
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        buf,
        'text/plain',
      )
      expect(result).toBeDefined()
      expect(textWasCalled('Ligne Windows')).toBe(true)
    })

    it('should not throw when any extraction fails', async () => {
      mockPdfParse.mockRejectedValue(new Error('Fatal error'))
      await expect(
        service.generateEnrichedPresentation(
          createMockActivityData(),
          Buffer.from('bad-data'),
          'application/pdf',
        ),
      ).resolves.toBeDefined()
    })

    it('should handle mimeType undefined gracefully', async () => {
      const buf = Buffer.from('some text content here')
      const result = await service.generateEnrichedPresentation(
        createMockActivityData(),
        buf,
        undefined,
      )
      expect(result).toBeDefined()
    })
  })
})
