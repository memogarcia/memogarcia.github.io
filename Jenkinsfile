pipeline {
    agent {
        label 'wsl2'
    }
    stages {
        stage ('Build a new version'){
            steps {
                sh 'do someting'
            }
        }
    }
    post {
        always {
            sh 'echo "yes"'
        }
        failure {
            sh 'echo "no"'
        }
    }
}