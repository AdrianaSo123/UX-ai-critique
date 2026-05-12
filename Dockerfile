FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Skip Playwright browser installs during npm install.
# The base image already includes browsers + system dependencies.
ENV NODE_ENV=production
ENV SKIP_PLAYWRIGHT_INSTALL=1

COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
