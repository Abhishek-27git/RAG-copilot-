FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose Next.js port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run development server
CMD ["npm", "run", "dev"]
