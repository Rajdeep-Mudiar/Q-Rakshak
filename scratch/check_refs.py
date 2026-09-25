import sqlite3

conn = sqlite3.connect('backend/qmedsense.db')
c = conn.cursor()
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
for t in tables:
    try:
        cols = [col[1] for col in c.execute(f"PRAGMA table_info({t})").fetchall()]
        for col in cols:
            count = c.execute(f"SELECT COUNT(*) FROM {t} WHERE {col} = ?", ('USR-ARYAN',)).fetchone()[0]
            if count > 0:
                print(f"{t}.{col}: {count}")
    except Exception as e:
        pass
