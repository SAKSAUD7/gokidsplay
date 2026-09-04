import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Credentials provided by user
DB_USER = "postgres"
DB_PASS = "admin@786"
DB_HOST = "localhost"
DB_PORT = "5432"
NEW_DB_NAME = "ninjapark_db"

def create_database():
    try:
        # Connect to the default 'postgres' database to create a new one
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{NEW_DB_NAME}'")
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Creating database '{NEW_DB_NAME}'...")
            cursor.execute(f"CREATE DATABASE {NEW_DB_NAME}")
            print("✅ Database created successfully!")
        else:
            print(f"ℹ️ Database '{NEW_DB_NAME}' already exists.")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

if __name__ == "__main__":
    create_database()
