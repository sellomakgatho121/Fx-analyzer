import sqlite3
import json
import logging
from datetime import datetime

DB_FILE = "fx_analyzer.db"


def init_db():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Signals Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                symbol TEXT,
                action TEXT,
                price REAL,
                confidence REAL,
                reasoning TEXT,
                risk_factors TEXT,
                raw_data TEXT
            )
        """)

        # Trades Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                symbol TEXT,
                action TEXT,
                entry_price REAL,
                exit_price REAL,
                pl REAL,
                status TEXT
            )
        """)

        # Users Table (SaaS Auth)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT DEFAULT 'user',
                subscription_status TEXT DEFAULT 'inactive',
                created_at TEXT
            )
        """)

        # Vibe Research Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vibe_research (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                run_type TEXT,
                prompt TEXT,
                command TEXT,
                output TEXT,
                status TEXT
            )
        """)
        
        # Insert Default Admin & User if empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute('''INSERT INTO users (email, password, name, role, subscription_status, created_at) 
                              VALUES ('devtest@fx.com', 'FxAdmin-9k$2pQ#8wLxZ5v!R@1', 'System Admin', 'admin', 'active', ?)''', (datetime.now().isoformat(),))
            cursor.execute('''INSERT INTO users (email, password, name, role, subscription_status, created_at) 
                              VALUES ('user@fx.com', 'password', 'Free User', 'user', 'inactive', ?)''', (datetime.now().isoformat(),))

        conn.commit()
        logging.info("Database initialized successfully.")
        return conn
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
        return None


def store_signal(signal_data):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO signals (timestamp, symbol, action, price, confidence, reasoning, risk_factors, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                signal_data.get("timestamp") or datetime.now().isoformat(),
                signal_data.get("symbol"),
                signal_data.get("action"),
                signal_data.get("price"),
                signal_data.get("confidence"),
                signal_data.get("ai_reasoning"),
                signal_data.get("risk_factors"),
                json.dumps(signal_data),
            ),
        )

        conn.commit()
        conn.close()
    except Exception as e:
        logging.error(f"Failed to store signal: {e}")


def store_trade(trade_data):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO trades (timestamp, symbol, action, entry_price, exit_price, pl, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                trade_data.get("timestamp") or datetime.now().isoformat(),
                trade_data.get("symbol"),
                trade_data.get("action"),
                trade_data.get("entry_price") or trade_data.get("price"),
                trade_data.get("exit_price"),
                trade_data.get("pl"),
                trade_data.get("status", "OPEN"),
            ),
        )

        conn.commit()
        conn.close()
    except Exception as e:
        logging.error(f"Failed to store trade: {e}")


def store_vibe_research(run_type, prompt, command, output, status):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO vibe_research (timestamp, run_type, prompt, command, output, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (datetime.now().isoformat(), run_type, prompt, command, output, status)
        )
        conn.commit()
        conn.close()
        logging.info(f"Stored vibe research run: {run_type}")
    except Exception as e:
        logging.error(f"Failed to store vibe research: {e}")


def get_latest_vibe_research():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vibe_research ORDER BY id DESC LIMIT 10")
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for r in rows:
            results.append({
                "id": r[0],
                "timestamp": r[1],
                "run_type": r[2],
                "prompt": r[3],
                "command": r[4],
                "output": r[5],
                "status": r[6]
            })
        return results
    except Exception as e:
        logging.error(f"Failed to get vibe research: {e}")
        return []
