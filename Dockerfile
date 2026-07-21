FROM node:22-slim

# Install WeasyPrint and its dependencies
# WeasyPrint requires: Python 3, pip, and several system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-cffi \
    python3-brotli \
    libffi-dev \
    libcairo2 \
    libpango-1.0-0 \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Install WeasyPrint via pip
RUN pip3 install --no-cache-dir weasyprint

WORKDIR /app

# Copy package files and patches before installing dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install Node dependencies using corepack-managed pnpm
RUN npm install -g corepack@latest && corepack pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN corepack pnpm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (optional, defaults to 3000)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
