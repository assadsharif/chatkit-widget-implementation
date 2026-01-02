# ChatKit Backend - Production Dockerfile for Railway
# Python 3.11 FastAPI Application

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy backend code
COPY backend/ /app/backend/

# Install dependencies
WORKDIR /app/backend
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Expose port (Railway sets this via $PORT)
EXPOSE 8000

# Start uvicorn (use shell form for $PORT environment variable)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
