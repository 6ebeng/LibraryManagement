/**
 * Installation/Deployment Testing - Docker Container Setup
 * Test Suite: TC_INSTALL_DOCKER_*
 * 
 * This test suite validates Docker container setup, configuration,
 * and deployment scenarios for the Library Management System.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

describe('Installation/Deployment Testing - Docker Setup', () => {
  const projectRoot = path.resolve(__dirname, '../../../');
  const timeout = 120000; // 2 minutes timeout for Docker operations

  beforeAll(() => {
    // Ensure we're in the project root
    process.chdir(projectRoot);
  });

  afterAll(async () => {
    // Cleanup: Stop any running containers
    try {
      execSync('docker-compose down -v', { stdio: 'ignore' });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Docker Image Build Verification', () => {
    test('TC_INSTALL_DOCKER_001: Should build all Docker images successfully', async () => {
      // Test server image build
      expect(() => {
        const result = execSync('docker build -t library-server-test ./server', { 
          encoding: 'utf8',
          timeout: 60000 
        });
        expect(result).toContain('Successfully built');
      }).not.toThrow();

      // Test client image build
      expect(() => {
        const result = execSync('docker build -t library-client-test ./client', { 
          encoding: 'utf8',
          timeout: 60000 
        });
        expect(result).toContain('Successfully built');
      }).not.toThrow();

      // Verify images exist
      const images = execSync('docker images --format "{{.Repository}}"', { encoding: 'utf8' });
      expect(images).toContain('library-server-test');
      expect(images).toContain('library-client-test');

      // Cleanup test images
      execSync('docker rmi library-server-test library-client-test', { stdio: 'ignore' });
    }, timeout);

    test('TC_INSTALL_DOCKER_002: Should validate Dockerfile syntax and best practices', () => {
      const serverDockerfile = path.join(projectRoot, 'server', 'Dockerfile');
      const clientDockerfile = path.join(projectRoot, 'client', 'Dockerfile');

      // Check if Dockerfiles exist
      expect(fs.existsSync(serverDockerfile)).toBe(true);
      expect(fs.existsSync(clientDockerfile)).toBe(true);

      // Read and validate Dockerfile content
      const serverContent = fs.readFileSync(serverDockerfile, 'utf8');
      const clientContent = fs.readFileSync(clientDockerfile, 'utf8');

      // Validate server Dockerfile
      expect(serverContent).toContain('FROM node:');
      expect(serverContent).toContain('WORKDIR');
      expect(serverContent).toContain('COPY package');
      expect(serverContent).toContain('RUN npm install');
      expect(serverContent).toContain('EXPOSE');

      // Validate client Dockerfile
      expect(clientContent).toContain('FROM node:');
      expect(clientContent).toContain('WORKDIR');
      expect(clientContent).toContain('COPY package');
      expect(clientContent).toContain('RUN npm install');
    });
  });

  describe('Docker Compose Service Orchestration', () => {
    test('TC_INSTALL_DOCKER_003: Should validate docker-compose.yml configuration', () => {
      const composeFile = path.join(projectRoot, 'docker-compose.yml');
      expect(fs.existsSync(composeFile)).toBe(true);

      const composeContent = fs.readFileSync(composeFile, 'utf8');
      
      // Validate essential services
      expect(composeContent).toContain('services:');
      expect(composeContent).toContain('server:');
      expect(composeContent).toContain('client:');
      expect(composeContent).toContain('mongodb:');

      // Validate port mappings
      expect(composeContent).toMatch(/ports:\s*-\s*["']?\d+:\d+["']?/);

      // Validate environment variables
      expect(composeContent).toContain('environment:');

      // Validate volumes
      expect(composeContent).toContain('volumes:');
    });

    test('TC_INSTALL_DOCKER_004: Should start services with docker-compose', async () => {
      // Create test environment file
      const envContent = `
NODE_ENV=test
PORT=5000
CLIENT_PORT=3000
MONGODB_URI=mongodb://mongodb:27017/library_test
JWT_SECRET=test_secret_key_for_testing
`;
      fs.writeFileSync(path.join(projectRoot, '.env.test'), envContent);

      try {
        // Start services in detached mode
        execSync('docker-compose -f docker-compose.yml --env-file .env.test up -d', {
          timeout: 90000,
          stdio: 'pipe'
        });

        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Check service status
        const psOutput = execSync('docker-compose ps --format json', { encoding: 'utf8' });
        const services = psOutput.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));

        // Verify services are running
        const runningServices = services.filter(service => service.State === 'running');
        expect(runningServices.length).toBeGreaterThan(0);

        // Check if MongoDB is accessible
        const mongoService = services.find(service => service.Service === 'mongodb');
        if (mongoService) {
          expect(mongoService.State).toBe('running');
        }

      } catch (error) {
        console.error('Docker compose startup error:', error.message);
        throw error;
      } finally {
        // Cleanup
        try {
          execSync('docker-compose down -v', { stdio: 'ignore' });
          fs.unlinkSync(path.join(projectRoot, '.env.test'));
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }, timeout);
  });

  describe('Environment Configuration Testing', () => {
    test('TC_INSTALL_ENV_001: Should validate required environment variables', () => {
      const envExampleFile = path.join(projectRoot, '.env.example');
      
      if (fs.existsSync(envExampleFile)) {
        const envContent = fs.readFileSync(envExampleFile, 'utf8');
        
        // Check for required environment variables
        const requiredVars = [
          'NODE_ENV',
          'PORT',
          'MONGODB_URI',
          'JWT_SECRET'
        ];

        requiredVars.forEach(varName => {
          expect(envContent).toContain(varName);
        });
      } else {
        // If .env.example doesn't exist, check if environment variables are documented
        const readmeFile = path.join(projectRoot, 'README.md');
        if (fs.existsSync(readmeFile)) {
          const readmeContent = fs.readFileSync(readmeFile, 'utf8');
          expect(readmeContent.toLowerCase()).toContain('environment');
        }
      }
    });

    test('TC_INSTALL_ENV_002: Should handle missing environment variables gracefully', () => {
      // Test server startup with missing environment variables
      const testEnvFile = path.join(projectRoot, '.env.missing-test');
      const incompleteEnvContent = `
NODE_ENV=test
# Missing PORT, MONGODB_URI, JWT_SECRET
`;
      fs.writeFileSync(testEnvFile, incompleteEnvContent);

      try {
        // This should either fail gracefully or use defaults
        const result = execSync('node server/index.js', {
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 10000,
          encoding: 'utf8'
        });
        
        // If it doesn't throw, it should at least log warnings about missing variables
        expect(result.toLowerCase()).toMatch(/(warning|error|missing|required)/);
      } catch (error) {
        // Expected behavior - should fail with meaningful error message
        expect(error.message.toLowerCase()).toMatch(/(environment|variable|missing|required)/);
      } finally {
        // Cleanup
        if (fs.existsSync(testEnvFile)) {
          fs.unlinkSync(testEnvFile);
        }
      }
    });
  });

  describe('Database Configuration Testing', () => {
    test('TC_INSTALL_DB_001: Should verify MongoDB container configuration', async () => {
      try {
        // Start only MongoDB service
        execSync('docker run -d --name test-mongo -p 27017:27017 mongo:latest', {
          timeout: 30000
        });

        // Wait for MongoDB to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Test connection
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb://localhost:27017/test_db', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });

        expect(mongoose.connection.readyState).toBe(1); // Connected

        await mongoose.disconnect();

      } catch (error) {
        console.error('MongoDB test error:', error.message);
        throw error;
      } finally {
        // Cleanup
        try {
          execSync('docker stop test-mongo && docker rm test-mongo', { stdio: 'ignore' });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }, timeout);

    test('TC_INSTALL_DB_002: Should validate database initialization scripts', () => {
      const serverDir = path.join(projectRoot, 'server');
      const possibleInitPaths = [
        path.join(serverDir, 'scripts', 'init-db.js'),
        path.join(serverDir, 'config', 'database.js'),
        path.join(serverDir, 'models'),
        path.join(serverDir, 'index.js')
      ];

      // Check if database initialization logic exists
      let hasDbInit = false;
      possibleInitPaths.forEach(initPath => {
        if (fs.existsSync(initPath)) {
          const content = fs.readFileSync(initPath, 'utf8');
          if (content.includes('mongoose') || content.includes('mongodb') || content.includes('connect')) {
            hasDbInit = true;
          }
        }
      });

      expect(hasDbInit).toBe(true);
    });
  });

  describe('Cross-Platform Deployment Testing', () => {
    test('TC_INSTALL_PLATFORM_001: Should validate cross-platform file paths', () => {
      const dockerfiles = [
        path.join(projectRoot, 'server', 'Dockerfile'),
        path.join(projectRoot, 'client', 'Dockerfile')
      ];

      dockerfiles.forEach(dockerfile => {
        if (fs.existsSync(dockerfile)) {
          const content = fs.readFileSync(dockerfile, 'utf8');
          
          // Check for Unix-style paths (should work on all platforms in Docker)
          const pathMatches = content.match(/COPY\s+[^\s]+\s+[^\s]+/g) || [];
          pathMatches.forEach(copyCmd => {
            // Ensure no Windows-style backslashes in Docker paths
            expect(copyCmd).not.toMatch(/\\/);
          });
        }
      });
    });

    test('TC_INSTALL_PLATFORM_002: Should validate port configuration', () => {
      const composeFile = path.join(projectRoot, 'docker-compose.yml');
      if (fs.existsSync(composeFile)) {
        const content = fs.readFileSync(composeFile, 'utf8');
        
        // Extract port mappings
        const portMappings = content.match(/["']?\d+:\d+["']?/g) || [];
        
        portMappings.forEach(mapping => {
          const [hostPort, containerPort] = mapping.replace(/["']/g, '').split(':');
          
          // Validate port ranges
          expect(parseInt(hostPort)).toBeGreaterThan(0);
          expect(parseInt(hostPort)).toBeLessThan(65536);
          expect(parseInt(containerPort)).toBeGreaterThan(0);
          expect(parseInt(containerPort)).toBeLessThan(65536);
        });
      }
    });
  });

  describe('Smoke Testing After Deployment', () => {
    test('TC_INSTALL_SMOKE_001: Should perform basic health check', async () => {
      // This test would typically run after full deployment
      // For now, we'll test the basic server startup
      
      const serverPath = path.join(projectRoot, 'server');
      const packageJsonPath = path.join(serverPath, 'package.json');
      
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.start || packageJson.scripts.dev).toBeDefined();
    });

    test('TC_INSTALL_SMOKE_002: Should validate application structure', () => {
      const requiredPaths = [
        path.join(projectRoot, 'server', 'package.json'),
        path.join(projectRoot, 'client', 'package.json'),
        path.join(projectRoot, 'docker-compose.yml'),
        path.join(projectRoot, 'server', 'index.js'),
        path.join(projectRoot, 'server', 'models'),
        path.join(projectRoot, 'server', 'controllers'),
        path.join(projectRoot, 'server', 'routes')
      ];

      requiredPaths.forEach(requiredPath => {
        expect(fs.existsSync(requiredPath)).toBe(true);
      });
    });
  });

  describe('Recovery and Rollback Testing', () => {
    test('TC_INSTALL_RECOVERY_001: Should validate Docker restart policies', () => {
      const composeFile = path.join(projectRoot, 'docker-compose.yml');
      if (fs.existsSync(composeFile)) {
        const content = fs.readFileSync(composeFile, 'utf8');
        
        // Check for restart policies
        const hasRestartPolicy = content.includes('restart:') || content.includes('restart_policy:');
        
        if (hasRestartPolicy) {
          // Validate restart policy values
          const restartPolicies = content.match(/restart:\s*["']?([^"'\n]+)["']?/g) || [];
          restartPolicies.forEach(policy => {
            const policyValue = policy.split(':')[1].trim().replace(/["']/g, '');
            expect(['no', 'always', 'on-failure', 'unless-stopped']).toContain(policyValue);
          });
        }
      }
    });

    test('TC_INSTALL_ROLLBACK_001: Should validate backup and rollback procedures', () => {
      const possibleBackupScripts = [
        path.join(projectRoot, 'scripts', 'backup.sh'),
        path.join(projectRoot, 'scripts', 'rollback.sh'),
        path.join(projectRoot, 'docker-compose.backup.yml'),
        path.join(projectRoot, 'README.md')
      ];

      let hasBackupStrategy = false;
      possibleBackupScripts.forEach(scriptPath => {
        if (fs.existsSync(scriptPath)) {
          const content = fs.readFileSync(scriptPath, 'utf8');
          if (content.toLowerCase().includes('backup') || content.toLowerCase().includes('rollback')) {
            hasBackupStrategy = true;
          }
        }
      });

      // At minimum, should have documentation about backup/rollback
      expect(hasBackupStrategy).toBe(true);
    });
  });
});

/**
 * Utility functions for installation testing
 */
class InstallationTestUtils {
  static async waitForService(url, timeout = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(url, { timeout: 5000 });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }

  static async checkContainerHealth(containerName) {
    try {
      const result = execSync(`docker inspect --format='{{.State.Health.Status}}' ${containerName}`, {
        encoding: 'utf8'
      });
      return result.trim() === 'healthy';
    } catch (error) {
      return false;
    }
  }

  static getDockerComposeServices() {
    try {
      const result = execSync('docker-compose config --services', { encoding: 'utf8' });
      return result.trim().split('\n').filter(service => service.length > 0);
    } catch (error) {
      return [];
    }
  }
}

module.exports = { InstallationTestUtils }; 