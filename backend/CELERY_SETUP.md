# Celery Setup Guide

This guide explains how to set up and run Celery for background task processing in the Election Cart application.

## What is Celery?

Celery is a distributed task queue that allows you to run time-consuming tasks asynchronously in the background. In this application, Celery is used for:

- **Thumbnail Generation**: Automatically generate thumbnails for product images
- **Image Optimization**: Compress and resize large product images
- **Invoice Generation**: Generate PDF invoices asynchronously

## Prerequisites

1. **Redis**: Celery requires a message broker. We use Redis.
   
   **Install Redis:**
   
   - **Ubuntu/Debian:**
     ```bash
     sudo apt-get update
     sudo apt-get install redis-server
     sudo systemctl start redis
     ```
   
   - **macOS (using Homebrew):**
     ```bash
     brew install redis
     brew services start redis
     ```
   
   - **Windows:**
     Download and install from: https://github.com/microsoftarchive/redis/releases

2. **Python Dependencies**: Install Celery and Redis client
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. **Environment Variables**: Add to your `.env` file (optional - defaults are provided):
   ```
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   ```

2. **Verify Redis is Running**:
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

## Running Celery

### Development

1. **Start Redis** (if not already running):
   ```bash
   redis-server
   ```

2. **Start Celery Worker** (in a separate terminal):
   ```bash
   cd backend
   celery -A election_cart worker --loglevel=info
   ```

3. **Start Django Development Server** (in another terminal):
   ```bash
   cd backend
   python manage.py runserver
   ```

### Production

For production, use a process manager like Supervisor or systemd to manage Celery workers.

**Example Supervisor Configuration** (`/etc/supervisor/conf.d/celery.conf`):

```ini
[program:celery-worker]
command=/path/to/venv/bin/celery -A election_cart worker --loglevel=info
directory=/path/to/backend
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
```

**Start with Supervisor:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker
```

## Background Tasks

### 1. Thumbnail Generation

**Task**: `products.tasks.generate_thumbnail_async`

Automatically generates thumbnails for product images.

**Usage**:
```python
from products.tasks import generate_thumbnail_async

# Queue thumbnail generation
generate_thumbnail_async.delay(product_image_id)
```

### 2. Image Optimization

**Task**: `products.tasks.optimize_product_image_async`

Optimizes large product images by resizing and compressing them.

**Usage**:
```python
from products.tasks import optimize_product_image_async

# Queue image optimization
optimize_product_image_async.delay(product_image_id)
```

### 3. Invoice Generation

**Task**: `orders.tasks.generate_invoice_async`

Generates PDF invoices for orders asynchronously.

**Usage**:
```python
from orders.tasks import generate_invoice_async

# Queue invoice generation
generate_invoice_async.delay(order_id)
```

## Monitoring

### Check Task Status

```bash
# View active tasks
celery -A election_cart inspect active

# View registered tasks
celery -A election_cart inspect registered

# View worker stats
celery -A election_cart inspect stats
```

### Flower (Web-based Monitoring)

Install Flower for a web-based monitoring interface:

```bash
pip install flower
```

Run Flower:
```bash
celery -A election_cart flower
```

Access at: http://localhost:5555

## Troubleshooting

### Redis Connection Error

**Error**: `Error 111 connecting to localhost:6379. Connection refused.`

**Solution**: Make sure Redis is running:
```bash
redis-server
```

### Tasks Not Executing

1. Check if Celery worker is running
2. Check Redis connection
3. View Celery logs for errors:
   ```bash
   celery -A election_cart worker --loglevel=debug
   ```

### Task Failures

Tasks automatically retry up to 3 times with a 60-second delay between retries. Check logs for detailed error messages.

## Optional: Running Without Celery

If you don't want to use Celery, the application will still work. Tasks will execute synchronously:

- Thumbnails will be generated when images are uploaded (may slow down uploads)
- Invoices will be generated on-demand (may slow down downloads)

To disable Celery, simply don't start the Celery worker. The application will detect this and execute tasks synchronously.

## Performance Benefits

Using Celery provides several benefits:

1. **Faster Response Times**: Image uploads and invoice downloads return immediately
2. **Better User Experience**: Users don't wait for background processing
3. **Scalability**: Can add more workers to handle increased load
4. **Reliability**: Failed tasks automatically retry
5. **Resource Management**: Heavy tasks don't block web server threads

## Next Steps

- Set up monitoring with Flower
- Configure task scheduling with Celery Beat (for periodic tasks)
- Add more background tasks as needed
- Scale workers based on load
