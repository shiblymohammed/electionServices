# Backend Setup Instructions

## Prerequisites
- Python 3.10+
- PostgreSQL database
- Firebase credentials (see FIREBASE_SETUP.md)

## Installation Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Update the following variables in `.env`:
- `DJANGO_SECRET_KEY`: Generate a secure secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Your PostgreSQL credentials
- `FIREBASE_CREDENTIALS_PATH`: Path to your Firebase credentials JSON file

### 3. Run Database Migrations
```bash
python manage.py migrate
```

### 4. Seed Initial Product Data
```bash
python manage.py seed_products
```

This will create:
- **Election Hungama Package** (₹18,500) with:
  - Ward Level App
  - AI Intro Videos
  - Digital Printer

- **Campaigns**:
  - Coffee with Candidate (₹10,000 per ward)
  - Vision in VR (₹15,000 per ward)
  - Podcast Live Studio (₹12,000 per ward)
  - Health ATM (₹8,000 per ward)

### 5. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/verify-phone/` - Verify phone with Firebase token
- `GET /api/auth/me/` - Get current user profile

### Products
- `GET /api/packages/` - List all packages
- `GET /api/packages/{id}/` - Get package details
- `GET /api/campaigns/` - List all campaigns
- `GET /api/campaigns/{id}/` - Get campaign details

## Testing the API

You can test the endpoints using curl or Postman:

```bash
# Get all packages
curl http://localhost:8000/api/packages/

# Get all campaigns
curl http://localhost:8000/api/campaigns/
```

## Troubleshooting

### Database Connection Error
Make sure PostgreSQL is running and credentials in `.env` are correct.

### Firebase Initialization Error
Ensure `FIREBASE_CREDENTIALS_PATH` points to a valid Firebase service account JSON file.

### Module Not Found Errors
Run `pip install -r requirements.txt` to install all dependencies.
