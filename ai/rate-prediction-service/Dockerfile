FROM python:3.12-slim

WORKDIR /app

# Create a non-root user to run the application
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure application files are owned by the non-root user
RUN chown -R appuser:appuser /app

# Run subsequent commands as the non-root user
USER appuser
EXPOSE 8081

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8081"]
