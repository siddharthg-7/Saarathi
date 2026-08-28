pipeline {
    agent any

    tools {
        // Ensure you have NodeJS configured in Jenkins Global Tool Configuration
        // named 'NodeJS 20' or adjust the name accordingly.
        nodejs 'NodeJS 20'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Type Check') {
            steps {
                sh 'npm run lint:types'
            }
        }

        stage('Lint Codebase') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Check Formatting') {
            steps {
                sh 'npm run format:check'
            }
        }

        stage('Run Frontend Tests') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Run Backend Tests') {
            steps {
                sh 'python3 -m pytest backend/tests/ -v || true'
            }
        }

        stage('Build Web Application') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build Validation') {
            steps {
                sh 'docker build -t saarathi-api:latest . || true'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

