import type { NextConfig } from "next";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

// Get git commit hash and package version at build time
const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Failed to get git commit hash:', error);
    return 'unknown';
  }
};

const getPackageVersion = () => {
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.warn('Failed to get package version:', error);
    return '0.1.0';
  }
};

const nextConfig: NextConfig = {
  env: {
    GIT_COMMIT_SHA: getGitCommitHash(),
    PACKAGE_VERSION: getPackageVersion(),
    BUILD_TIME: new Date().toISOString(),
  },
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
