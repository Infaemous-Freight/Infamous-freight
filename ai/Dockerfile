FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root user and group to run the application
RUN groupadd -r appuser && useradd -r -g appuser appuser && chown -R appuser:appuser /app

USER appuser
EXPOSE 8000

CMD ["python", "main.py"]
