# Requirements Document

## Introduction

Ce document définit les exigences pour les tests unitaires du service SMS Twilio (SmsService). Le service utilise l'API Twilio pour envoyer des SMS de rappel aux employés recommandés pour des activités. Les tests doivent couvrir l'initialisation du service, l'envoi de messages, la normalisation des numéros de téléphone, et la gestion des erreurs.

## Glossary

- **SmsService**: Service NestJS responsable de l'envoi de SMS via l'API Twilio
- **Test_Suite**: Ensemble de tests unitaires pour le SmsService
- **Twilio_Client**: Client Twilio initialisé avec les credentials (accountSid, authToken)
- **E164_Format**: Format international de numéro de téléphone (+[country code][number])
- **ConfigService**: Service NestJS fournissant l'accès aux variables d'environnement
- **Mock**: Objet simulé remplaçant une dépendance réelle pendant les tests

## Requirements

### Requirement 1: Test de l'initialisation du service

**User Story:** En tant que développeur, je veux tester l'initialisation du SmsService, afin de vérifier que le service se configure correctement avec ou sans credentials Twilio valides.

#### Acceptance Criteria

1. WHEN valid Twilio credentials are provided (TWILIO_ACCOUNT_SID starts with "AC", TWILIO_AUTH_TOKEN has more than 10 characters, TWILIO_PHONE_NUMBER is set), THE Test_Suite SHALL verify that the Twilio_Client is initialized
2. WHEN TWILIO_ACCOUNT_SID does not start with "AC", THE Test_Suite SHALL verify that the Twilio_Client remains null
3. WHEN TWILIO_AUTH_TOKEN is missing or has 10 or fewer characters, THE Test_Suite SHALL verify that the Twilio_Client remains null
4. WHEN TWILIO_PHONE_NUMBER is missing, THE Test_Suite SHALL verify that the Twilio_Client remains null
5. WHEN all credentials are missing, THE Test_Suite SHALL verify that the service initializes without throwing errors

### Requirement 2: Test de l'envoi de SMS de rappel

**User Story:** En tant que développeur, je veux tester la méthode sendRecommendationReminder, afin de vérifier que les SMS sont envoyés correctement avec le bon contenu et format.

#### Acceptance Criteria

1. WHEN sendRecommendationReminder is called with valid parameters and Twilio_Client is initialized, THE Test_Suite SHALL verify that the Twilio_Client.messages.create method is called with correct body, from, and to parameters
2. WHEN sendRecommendationReminder is called with a Tunisian phone number (8 digits), THE Test_Suite SHALL verify that the number is normalized to E164_Format (+216XXXXXXXX)
3. WHEN sendRecommendationReminder is called without deadlineDays parameter, THE Test_Suite SHALL verify that the SMS body contains "3 jours" as default deadline
4. WHEN sendRecommendationReminder is called with custom deadlineDays parameter, THE Test_Suite SHALL verify that the SMS body contains the specified deadline
5. WHEN sendRecommendationReminder is called without frontendUrl parameter, THE Test_Suite SHALL verify that the SMS body contains the default URL from environment or fallback
6. WHEN Twilio_Client is null (not configured), THE Test_Suite SHALL verify that sendRecommendationReminder returns immediately without attempting to send SMS

### Requirement 3: Test de la normalisation des numéros de téléphone

**User Story:** En tant que développeur, je veux tester la méthode normalizePhone, afin de vérifier que les numéros de téléphone sont correctement convertis au format E.164.

#### Acceptance Criteria

1. WHEN normalizePhone receives an 8-digit Tunisian number, THE Test_Suite SHALL verify that it returns the number prefixed with "+216"
2. WHEN normalizePhone receives a number already in E164_Format (starts with "+"), THE Test_Suite SHALL verify that it returns the number unchanged
3. WHEN normalizePhone receives a number with "00" prefix, THE Test_Suite SHALL verify that it converts "00" to "+"
4. WHEN normalizePhone receives a number with spaces, hyphens, parentheses, or dots, THE Test_Suite SHALL verify that these characters are removed
5. WHEN normalizePhone receives an empty string or null, THE Test_Suite SHALL verify that it returns null
6. WHEN normalizePhone receives an invalid format (not matching any pattern), THE Test_Suite SHALL verify that it returns null

### Requirement 4: Test de la gestion des erreurs Twilio

**User Story:** En tant que développeur, je veux tester la gestion des erreurs lors de l'envoi de SMS, afin de vérifier que les erreurs sont loggées sans bloquer l'exécution.

#### Acceptance Criteria

1. WHEN Twilio_Client.messages.create throws an error, THE Test_Suite SHALL verify that sendRecommendationReminder logs the error
2. WHEN Twilio_Client.messages.create throws an error, THE Test_Suite SHALL verify that sendRecommendationReminder completes without throwing
3. WHEN an invalid phone number is provided to sendRecommendationReminder, THE Test_Suite SHALL verify that a warning is logged
4. WHEN an invalid phone number is provided to sendRecommendationReminder, THE Test_Suite SHALL verify that no SMS sending is attempted
5. WHEN Twilio initialization fails in constructor, THE Test_Suite SHALL verify that a warning is logged and the service remains functional

### Requirement 5: Test de l'intégration avec ConfigService

**User Story:** En tant que développeur, je veux tester l'interaction avec ConfigService, afin de vérifier que les variables d'environnement sont correctement récupérées.

#### Acceptance Criteria

1. WHEN SmsService is instantiated, THE Test_Suite SHALL verify that ConfigService.get is called for TWILIO_ACCOUNT_SID
2. WHEN SmsService is instantiated, THE Test_Suite SHALL verify that ConfigService.get is called for TWILIO_AUTH_TOKEN
3. WHEN SmsService is instantiated, THE Test_Suite SHALL verify that ConfigService.get is called for TWILIO_PHONE_NUMBER
4. WHEN ConfigService returns undefined for any credential, THE Test_Suite SHALL verify that the service handles it gracefully
5. WHEN ConfigService returns valid credentials, THE Test_Suite SHALL verify that these values are used to initialize the Twilio_Client

### Requirement 6: Test du formatage du message SMS

**User Story:** En tant que développeur, je veux tester le contenu du message SMS généré, afin de vérifier que toutes les informations requises sont présentes et correctement formatées.

#### Acceptance Criteria

1. WHEN sendRecommendationReminder is called, THE Test_Suite SHALL verify that the SMS body contains the employee name
2. WHEN sendRecommendationReminder is called, THE Test_Suite SHALL verify that the SMS body contains the activity title
3. WHEN sendRecommendationReminder is called, THE Test_Suite SHALL verify that the SMS body contains the activity date formatted in French locale (dd month yyyy)
4. WHEN sendRecommendationReminder is called, THE Test_Suite SHALL verify that the SMS body contains the deadline in days
5. WHEN sendRecommendationReminder is called, THE Test_Suite SHALL verify that the SMS body contains the frontend URL with path "/employee/activities"
