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
