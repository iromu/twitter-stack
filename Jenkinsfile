pipeline {
    agent none

    stages  {

        stage('Docker twitter-discovery'){
         agent { label 'docker'  }
         steps {
             sh 'docker build --no-cache -t iromu/discovery:latest ./discovery -f ./discovery/Dockerfile'
             sh 'docker push iromu/twitter-discovery:latest'
         }
        }

        stage('Docker twitter-feed'){
         agent { label 'docker'  }
         steps {
             sh 'docker build --no-cache -t iromu/twitter-feed:latest ./kibana -f ./twitter-feed/Dockerfile'
             sh 'docker push iromu/twitter-feed:latest'
         }
        }

        stage('Docker feed-init'){
         agent { label 'docker'  }
         steps {
             sh 'docker build --no-cache -t iromu/feed-init:latest ./logstash -f ./feed-init/Dockerfile'
             sh 'docker push iromu/feed-init:latest'
         }
        }

        stage('Docker logstashclient'){
         agent { label 'docker'  }
         steps {
             sh 'docker build --no-cache -t iromu/logstashclient:latest ./logstash -f ./logstashclient/Dockerfile'
             sh 'docker push iromu/logstashclient:latest'
         }
        }

       stage('Cleanup'){
         agent any

         steps {
            cleanWs()
         }
       }

    }
}
