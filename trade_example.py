#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
J.A.R.V.I.S. Algorithmic Trading Template (CCXT + Pandas-TA)
============================================================
ADVERTENCIA DE SEGURIDAD (DIRECTIVA PROTOCOLO 1):
ESTE SCRIPT ESTÁ CONFIGURADO ESTRICTAMENTE PARA LA TESTNET (DINERO FALSO).
NO MODIFICAR `set_sandbox_mode(True)` HASTA APROBAR LA ESTRATEGIA EN LANCEDB.

Uso para J.A.R.V.I.S.:
Este script sirve como plantilla base para solicitar datos OHLCV, calcular
indicadores matemáticos duros (evitando alucinaciones del LLM) y ejecutar
órdenes de mercado simuladas.

Dependencias requeridas (instalar vía jarvis-os):
pip install ccxt pandas pandas-ta
"""

import sys
import argparse
import ccxt
import pandas as pd
import pandas_ta as ta

def get_market_data(exchange, symbol, timeframe, limit=100):
    try:
        # Descargar velas (Open, High, Low, Close, Volume)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except Exception as e:
        print(f"ERROR_FETCH: {str(e)}", file=sys.stderr)
        sys.exit(1)

def calculate_indicators(df):
    try:
        # Cálculos matemáticos puros (Delega esto a la CPU, no al LLM)
        df.ta.rsi(length=14, append=True)
        df.ta.macd(fast=12, slow=26, signal=9, append=True)
        # Limpiar NaNs
        df.fillna(0, inplace=True)
        return df
    except Exception as e:
        print(f"ERROR_MATH: {str(e)}", file=sys.stderr)
        sys.exit(1)

def execute_paper_trade(exchange, symbol, side, amount):
    try:
        # Ejecución simulada de mercado
        order = exchange.create_market_order(symbol, side, amount)
        print(f"TRADE_SUCCESS: Orden {side.upper()} de {amount} {symbol} ejecutada. ID: {order['id']}")
    except Exception as e:
        print(f"TRADE_ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="J.A.R.V.I.S. Trading Engine")
    parser.add_argument('--symbol', type=str, default='BTC/USDT', help='Par de trading')
    parser.add_argument('--action', type=str, choices=['analyze', 'buy', 'sell'], default='analyze')
    parser.add_argument('--amount', type=float, default=0.001, help='Cantidad a operar (Solo Testnet)')

    args = parser.parse_args()

    # 1. Inicializar Exchange en modo Seguro (Sandbox / Testnet)
    # Por defecto usamos Binance Testnet para pruebas algorítmicas.
    exchange = ccxt.binance({
        'apiKey': 'TU_API_KEY_DE_TESTNET_AQUI',
        'secret': 'TU_SECRET_DE_TESTNET_AQUI',
        'enableRateLimit': True,
    })
    exchange.set_sandbox_mode(True) # ¡VITAL PARA LA SEGURIDAD DEL USUARIO!

    # 2. Análisis de Mercado
    if args.action == 'analyze':
        print(f"ANALYZING: {args.symbol}...")
        df = get_market_data(exchange, args.symbol, '15m')
        df = calculate_indicators(df)

        last_row = df.iloc[-1]

        # Salida limpia para que el LLM (J.A.R.V.I.S.) la lea y razone
        print(f"PRICE: {last_row['close']:.2f}")
        print(f"RSI_14: {last_row['RSI_14']:.2f}")
        print(f"MACD_HIST: {last_row['MACDh_12_26_9']:.4f}")

        if last_row['RSI_14'] < 30:
            print("SIGNAL: Sobrevendido (Posible Compra)")
        elif last_row['RSI_14'] > 70:
            print("SIGNAL: Sobrecomprado (Posible Venta)")
        else:
            print("SIGNAL: Neutral")

    # 3. Ejecución de Órdenes
    elif args.action in ['buy', 'sell']:
        print(f"EXECUTING: {args.action.upper()} {args.amount} {args.symbol} EN TESTNET...")
        execute_paper_trade(exchange, args.symbol, args.action, args.amount)
