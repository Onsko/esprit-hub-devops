# 🚀 Configuration Jenkins + SonarQube

## 📋 Résumé

Tu as Jenkins et SonarQube installés. Voici comment configurer les pipelines pour lancer les tests et voir le coverage.

---

## ⚙️ Configuration Jenkins (5 minutes)

### 1. Créer un credential SonarQube

1. **Manage Jenkins** → **Manage Credentials**
2. **System** → **Global credentials**
3. **Add Credentials**
   - Kind: **Secret text**
   - Secret: (Ton token SonarQube)
   - ID: `sonarqube-token`
4. **Create**

### 2. Configurer SonarQube Server

1. **Manage Jenkins** → **Configure System**
2. Scroll jusqu'à **SonarQube servers**
3. **Add SonarQube**
   - Name: `SonarQubeServer`
   - Server URL: `http://localhost:9000`
   - Server authentication token: `sonarqube-token`
4. **Save**

### 3. Configurer SonarQube Scanner

1. **Manage Jenkins** → **Tools**
2. **SonarQube Scanner installations**
3. **Add SonarQube Scanner**
   - Name: `SonarScanner`
   - Version: `Latest`
4. **Save**

### 4. Configurer Node.js

1. **Manage Jenkins** → **Tools**
2. **NodeJS installations**
3. **Add NodeJS**
   - Name: `Node20`
   - Version: `20.x`
4. **Save**

---

## 📦 Créer les Pipelines

### Pipeline CI-Back (Tests Backend)

1. **New Item**
2. Name: `CI-Back`
3. Type: **Pipeline**
4. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Onsko/esprit-hub-devops.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile.ci.back`
5. **Save**

### Pipeline CI-Front (Tests Frontend)

1. **New Item**
2. Name: `CI-Front`
3. Type: **Pipeline**
4. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Onsko/esprit-hub-devops.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile.ci.front`
5. **Save**

---

## 🧪 Lancer les Tests

### Déclencher CI-Back

1. Va à **CI-Back**
2. Clique **Build Now**
3. Attends 3-5 minutes

### Déclencher CI-Front

1. Va à **CI-Front**
2. Clique **Build Now**
3. Attends 3-5 minutes

---

## 📊 Voir les Résultats

### Dans Jenkins

- Clique sur le build → **Console Output** : Voir les logs
- Clique sur le build → **Coverage Report** : Voir le coverage

### Dans SonarQube

```
http://localhost:9000
```

Tu verras :
- **skillup-backend** : Coverage, Code Smells, Bugs
- **skillup-frontend** : Coverage, Code Smells, Bugs

---

## 📝 Ce que font les Jenkinsfiles

### Jenkinsfile.ci.back

```
1. Checkout du code
2. Installation des dépendances backend
3. Exécution des tests (npm run test:ci)
4. Génération du coverage (lcov.info)
5. Analyse SonarQube
6. Build du backend
7. Archivage des artefacts
```

### Jenkinsfile.ci.front

```
1. Checkout du code
2. Installation des dépendances frontend
3. Exécution des tests (npm run test:ci)
4. Génération du coverage (lcov.info)
5. Analyse SonarQube
6. Build du frontend
7. Archivage des artefacts
```

---

## ✅ Vérifier que tout fonctionne

```bash
# Tester localement d'abord
cd backend
npm run test:ci

cd ../frontend
npm run test:ci
```

Si les tests passent localement, ils passeront dans Jenkins.

---

## 🔍 Troubleshooting

### Les tests échouent dans Jenkins mais pas localement

- Vérifie que Node.js 20 est configuré dans Jenkins
- Vérifie que les dépendances sont installées correctement

### Pas de coverage dans SonarQube

- Vérifie que `coverage/lcov.info` existe après les tests
- Vérifie que `sonar-project.properties` est correct

### SonarQube ne reçoit pas les données

- Vérifie que le token SonarQube est correct
- Vérifie que `SonarQubeServer` est configuré correctement

---

**C'est prêt ! Lance les pipelines et vois le coverage ! 🚀**
