/**
 * Smoke test to verify Tremor + React dependencies are properly installed
 * and the build pipeline is configured correctly.
 * 
 * Requirements: Frontend UI Library (Introduction), 9.3, 9.4
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const clientDir = path.join(__dirname, '..', 'client');

describe('React + Tremor + Tailwind CSS Build Pipeline', () => {
  describe('Dependencies', () => {
    it('should have @tremor/react installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', '@tremor', 'react', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('@tremor/react');
    });

    it('should have react installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', 'react', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('react');
    });

    it('should have react-dom installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', 'react-dom', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('react-dom');
    });

    it('should have tailwindcss installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', 'tailwindcss', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('tailwindcss');
    });

    it('should have @headlessui/react (Radix UI alternative via Tremor) installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', '@headlessui', 'react', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
    });

    it('should have vite installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', 'vite', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
    });

    it('should have typescript installed', () => {
      const pkgPath = path.join(clientDir, 'node_modules', 'typescript', 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
    it('should have tailwind.config.js with Tremor content paths', () => {
      const configPath = path.join(clientDir, 'tailwind.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('@tremor');
      expect(content).toContain('./src/**/*.{js,ts,jsx,tsx}');
    });

    it('should have postcss.config.js with tailwindcss plugin', () => {
      const configPath = path.join(clientDir, 'postcss.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('tailwindcss');
      expect(content).toContain('autoprefixer');
    });

    it('should have vite.config.ts with API proxy', () => {
      const configPath = path.join(clientDir, 'vite.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('/api');
      expect(content).toContain('http://localhost:3000');
      expect(content).toContain('react');
    });

    it('should have tsconfig.json with React JSX support', () => {
      const configPath = path.join(clientDir, 'tsconfig.json');
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.compilerOptions.jsx).toBe('react-jsx');
    });
  });

  describe('Source Files', () => {
    it('should have main.tsx entry point', () => {
      const filePath = path.join(clientDir, 'src', 'main.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('ReactDOM');
      expect(content).toContain('App');
    });

    it('should have App.tsx with Tremor components', () => {
      const filePath = path.join(clientDir, 'src', 'App.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@tremor/react');
      expect(content).toContain('Card');
      expect(content).toContain('Title');
      expect(content).toContain('Badge');
    });

    it('should have index.css with Tailwind directives', () => {
      const filePath = path.join(clientDir, 'src', 'index.css');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@tailwind base');
      expect(content).toContain('@tailwind components');
      expect(content).toContain('@tailwind utilities');
    });

    it('should have index.html entry point', () => {
      const filePath = path.join(clientDir, 'index.html');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('src/main.tsx');
      expect(content).toContain('root');
    });
  });

  describe('Build Pipeline', () => {
    it('should pass TypeScript type checking', () => {
      const result = execSync('npx tsc --noEmit', { cwd: clientDir, encoding: 'utf-8' });
      // If no error thrown, TypeScript compilation succeeded
      expect(true).toBe(true);
    });

    it('should build successfully with Vite', () => {
      const result = execSync('npx vite build', { cwd: clientDir, encoding: 'utf-8' });
      expect(result).toContain('built in');
      // Verify output files exist
      const distDir = path.join(clientDir, 'dist');
      expect(fs.existsSync(distDir)).toBe(true);
    });

    it('should produce CSS output with Tailwind styles', () => {
      const distDir = path.join(clientDir, 'dist', 'assets');
      const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
      const cssContent = fs.readFileSync(path.join(distDir, cssFiles[0]), 'utf-8');
      // Tailwind base styles should be present
      expect(cssContent.length).toBeGreaterThan(1000);
    });

    it('should produce JS output with React bundle', () => {
      const distDir = path.join(clientDir, 'dist', 'assets');
      const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
      const jsContent = fs.readFileSync(path.join(distDir, jsFiles[0]), 'utf-8');
      expect(jsContent.length).toBeGreaterThan(1000);
    });
  });

  describe('Legacy Files Preserved', () => {
    it('should have legacy files moved to client/legacy/', () => {
      expect(fs.existsSync(path.join(clientDir, 'legacy', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(clientDir, 'legacy', 'js', 'main.js'))).toBe(true);
      expect(fs.existsSync(path.join(clientDir, 'legacy', 'styles', 'main.css'))).toBe(true);
    });
  });
});
