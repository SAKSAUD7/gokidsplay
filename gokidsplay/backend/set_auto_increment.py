import sqlite3
import sys

def main():
    try:
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        
        tables = ['bookings_booking', 'bookings_partybooking']
        
        for table in tables:
            cursor.execute("UPDATE sqlite_sequence SET seq = 8999 WHERE name = ?", (table,))
            if cursor.rowcount == 0:
                cursor.execute("INSERT INTO sqlite_sequence (name, seq) VALUES (?, 8999)", (table,))
                
        conn.commit()
        conn.close()
        print('Successfully updated SQLite sequences to start from 9000.')
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
