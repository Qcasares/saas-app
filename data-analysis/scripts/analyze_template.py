#!/usr/bin/env python3
"""
Data Analysis Template
Usage: python analyze_template.py --input <file.csv>
"""

import pandas as pd
import argparse
from datetime import datetime

def load_data(filepath):
    """Load data from CSV or Excel."""
    if filepath.endswith('.csv'):
        return pd.read_csv(filepath)
    elif filepath.endswith(('.xlsx', '.xls')):
        return pd.read_excel(filepath)
    else:
        raise ValueError(f"Unsupported file type: {filepath}")

def explore_data(df):
    """Basic data exploration."""
    print("\n=== DATA OVERVIEW ===")
    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"\nColumn Types:\n{df.dtypes}")
    print(f"\nMissing Values:\n{df.isnull().sum()}")
    print(f"\nBasic Statistics:\n{df.describe()}")
    return df

def clean_data(df):
    """Basic data cleaning."""
    # Remove duplicates
    initial_rows = len(df)
    df = df.drop_duplicates()
    print(f"Removed {initial_rows - len(df)} duplicate rows")
    
    # Report on nulls
    null_cols = df.columns[df.isnull().any()].tolist()
    if null_cols:
        print(f"Columns with nulls: {null_cols}")
    
    return df

def analyze(df):
    """Main analysis logic - customize this."""
    print("\n=== ANALYSIS ===")
    # Add your analysis here
    # Example:
    # - Aggregations
    # - Groupby operations
    # - Statistical tests
    return df

def main():
    parser = argparse.ArgumentParser(description='Data Analysis Script')
    parser.add_argument('--input', '-i', required=True, help='Input file path')
    parser.add_argument('--output', '-o', help='Output file path')
    args = parser.parse_args()
    
    print(f"Loading data from: {args.input}")
    df = load_data(args.input)
    
    df = explore_data(df)
    df = clean_data(df)
    df = analyze(df)
    
    if args.output:
        df.to_csv(args.output, index=False)
        print(f"\nResults saved to: {args.output}")
    
    print("\n✅ Analysis complete!")

if __name__ == '__main__':
    main()
