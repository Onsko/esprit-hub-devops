# Plan d'implémentation: Tests unitaires du service SMS Twilio

## Vue d'ensemble

Ce plan détaille l'implémentation complète des tests unitaires pour le SmsService. Les tests couvrent l'initialisation du service, l'envoi de SMS, la normalisation des numéros de téléphone, la gestion des erreurs, et l'intégration avec ConfigService.

**Framework:** Jest (standard NestJS)
**Approche:** Tests unitaires avec mocking complet des dépendances externes
**Objectif de couverture:** 100%

## Tâches

- [x] 1. Créer la structure de base du fichier de test et les mocks
  - Créer le fichier `backend/src/sms/sms.service.spec.ts`
  - Importer les dépendances nécessaires (@nestjs/testing, Jest)
  - Définir les mocks pour ConfigService et Twilio client
  - Configurer le module de test avec TestingModule
  - _Exigences: 1.1, 5.1, 5.2, 5.3_

- [x] 2. Implémenter les tests d'initialisation du service
  - [x] 2.1 Tester l'initialisation avec credentials valides
    - Vérifier que le client Twilio est initialisé
    - Vérifier que le log de succès est émis
    - _Exigences: 1.1, 5.5_
  
  - [x] 2.2 Tester l'initialisation avec ACCOUNT_SID invalide
    - Vérifier que le client reste null si SID ne commence pas par "AC"
    - Vérifier qu'un warning est loggé
    - _Exigences: 1.2_
  
  - [x] 2.3 Tester l'initialisation avec AUTH_TOKEN invalide
    - Vérifier que le client reste null si token ≤10 caractères
    - Vérifier qu'un warning est loggé
    - _Exigences: 1.3_
  
  - [x] 2.4 Tester l'initialisation avec PHONE_NUMBER manquant
    - Vérifier que le client reste null si numéro absent
    - Vérifier qu'un warning est loggé
    - _Exigences: 1.4_
  
  - [x] 2.5 Tester l'initialisation sans credentials
    - Vérifier que le service s'initialise sans erreur
    - Vérifier que le client est null
    - Vérifier qu'un warning est loggé
    - _Exigences: 1.5, 5.4_

- [x] 3. Implémenter les tests d'envoi de SMS (happy path)
  - [x] 3.1 Tester l'envoi avec paramètres valides
    - Vérifier que Twilio client.messages.create est appelé
    - Vérifier les paramètres body, from, to
    - Vérifier que le log de succès contient le SID
    - _Exigences: 2.1_
  
  - [x] 3.2 Tester le deadline par défaut
    - Vérifier que le SMS contient "3 jours" si deadlineDays non fourni
    - _Exigences: 2.3_
  
  - [x] 3.3 Tester le deadline personnalisé
    - Vérifier que le SMS contient la valeur deadlineDays fournie
    - _Exigences: 2.4_
  
  - [x] 3.4 Tester l'URL par défaut
    - Vérifier que le SMS contient l'URL de fallback si frontendUrl non fourni
    - _Exigences: 2.5_
  
  - [x] 3.5 Tester l'URL personnalisée
    - Vérifier que le SMS contient l'URL fournie
    - _Exigences: 2.5_

- [x] 4. Implémenter les tests de normalisation des numéros de téléphone
  - [x] 4.1 Tester la normalisation des numéros tunisiens (8 chiffres)
    - Vérifier que "12345678" devient "+21612345678"
    - Vérifier que le numéro normalisé est passé à Twilio
    - _Exigences: 2.2, 3.1_
  
  - [x] 4.2 Tester les numéros déjà en format E.164
    - Vérifier que "+33612345678" reste inchangé
    - _Exigences: 3.2_
  
  - [x] 4.3 Tester la conversion du préfixe "00"
    - Vérifier que "0033612345678" devient "+33612345678"
    - _Exigences: 3.3_
  
  - [x] 4.4 Tester le nettoyage des caractères de formatage
    - Vérifier que "(123) 456-7890" est nettoyé et validé
    - Vérifier que les espaces, tirets, parenthèses sont supprimés
    - _Exigences: 3.4_
  
  - [x] 4.5 Tester les entrées invalides
    - Vérifier que chaîne vide retourne null
    - Vérifier que null retourne null
    - Vérifier que format invalide retourne null
    - _Exigences: 3.5, 3.6_

- [x] 5. Implémenter les tests de gestion des erreurs
  - [x] 5.1 Tester l'erreur Twilio lors de l'envoi
    - Mocker Twilio pour lancer une erreur
    - Vérifier que l'erreur est loggée
    - Vérifier que la méthode ne lance pas d'exception
    - _Exigences: 4.1, 4.2_
  
  - [x] 5.2 Tester l'envoi avec numéro invalide
    - Fournir un numéro invalide
    - Vérifier qu'un warning est loggé
    - Vérifier que Twilio n'est pas appelé
    - _Exigences: 4.3, 4.4_
  
  - [x] 5.3 Tester l'envoi avec client null
    - Initialiser le service sans credentials
    - Vérifier que sendRecommendationReminder retourne immédiatement
    - Vérifier que Twilio n'est pas appelé
    - _Exigences: 2.6_
  
  - [x] 5.4 Tester l'échec d'initialisation Twilio
    - Mocker twilio.default pour lancer une erreur
    - Vérifier qu'un warning est loggé
    - Vérifier que le service reste fonctionnel
    - _Exigences: 4.5_

- [x] 6. Implémenter les tests de formatage du message SMS
  - [x] 6.1 Tester la présence du nom de l'employé
    - Vérifier que le body contient employeeName
    - _Exigences: 6.1_
  
  - [x] 6.2 Tester la présence du titre de l'activité
    - Vérifier que le body contient activityTitle
    - _Exigences: 6.2_
  
  - [x] 6.3 Tester le formatage de la date
    - Vérifier que la date est formatée en français (dd mois yyyy)
    - Tester avec différentes dates
    - _Exigences: 6.3_
  
  - [x] 6.4 Tester la présence du deadline
    - Vérifier que le body contient le nombre de jours
    - _Exigences: 6.4_
  
  - [x] 6.5 Tester la présence de l'URL avec le chemin
    - Vérifier que le body contient l'URL avec "/employee/activities"
    - _Exigences: 6.5_

- [x] 7. Vérifier la couverture de code
  - Exécuter `npm run test:cov` pour vérifier la couverture
  - S'assurer que la couverture atteint 100% pour sms.service.ts
  - Identifier et corriger les branches non couvertes si nécessaire

- [ ] 8. Checkpoint final - Vérifier que tous les tests passent
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- L'objectif de couverture de 100% est réaliste car le service est petit et entièrement testable
