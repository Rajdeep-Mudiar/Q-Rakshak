from __future__ import annotations

import logging
from typing import Any
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, StratifiedShuffleSplit

logger = logging.getLogger("ml.preprocessing.splitting")


class PatientGroupedSplitter:
    """Leakage-Safe Medical Dataset Splitter with Patient-Level Group Partitioning."""

    def __init__(self, train_size: float = 0.70, val_size: float = 0.15, test_size: float = 0.15, random_state: int = 42):
        if not np.isclose(train_size + val_size + test_size, 1.0, atol=1e-3):
            raise ValueError(f"Partition ratios must sum to 1.0, got: {train_size + val_size + test_size}")
        self.train_size = train_size
        self.val_size = val_size
        self.test_size = test_size
        self.random_state = random_state

    def split(
        self,
        df: pd.DataFrame,
        target_column: str,
        patient_id_column: str | None = None,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Splits dataframe into (train_df, val_df, test_df) with strict zero patient-level leakage."""
        if patient_id_column and patient_id_column in df.columns:
            # Grouped Patient Split
            groups = df[patient_id_column].values
            
            # 1. Split into (Train + Val) and Test
            gss_test = GroupShuffleSplit(n_splits=1, test_size=self.test_size, random_state=self.random_state)
            train_val_idx, test_idx = next(gss_test.split(df, df[target_column], groups))
            
            df_train_val = df.iloc[train_val_idx].copy()
            df_test = df.iloc[test_idx].copy()

            # 2. Split (Train + Val) into Train and Val
            if self.val_size > 0.0:
                val_ratio_adjusted = self.val_size / (self.train_size + self.val_size)
                gss_val = GroupShuffleSplit(n_splits=1, test_size=val_ratio_adjusted, random_state=self.random_state)
                train_sub_idx, val_sub_idx = next(gss_val.split(df_train_val, df_train_val[target_column], df_train_val[patient_id_column].values))
                df_train = df_train_val.iloc[train_sub_idx].copy()
                df_val = df_train_val.iloc[val_sub_idx].copy()
            else:
                df_train = df_train_val
                df_val = pd.DataFrame(columns=df.columns)

        else:
            # Stratified Split (one record per patient assumption)
            y = df[target_column].values
            sss_test = StratifiedShuffleSplit(n_splits=1, test_size=self.test_size, random_state=self.random_state)
            train_val_idx, test_idx = next(sss_test.split(df, y))

            df_train_val = df.iloc[train_val_idx].copy()
            df_test = df.iloc[test_idx].copy()

            if self.val_size > 0.0:
                val_ratio_adjusted = self.val_size / (self.train_size + self.val_size)
                sss_val = StratifiedShuffleSplit(n_splits=1, test_size=val_ratio_adjusted, random_state=self.random_state)
                train_sub_idx, val_sub_idx = next(sss_val.split(df_train_val, df_train_val[target_column].values))
                df_train = df_train_val.iloc[train_sub_idx].copy()
                df_val = df_train_val.iloc[val_sub_idx].copy()
            else:
                df_train = df_train_val
                df_val = pd.DataFrame(columns=df.columns)

        # Run Leakage Audit
        audit = audit_leakage(df_train, df_val, df_test, patient_id_column)
        if not audit["passed"]:
            raise RuntimeError(f"Data leakage detected during splitting: {audit['violations']}")

        logger.info(f"Generated clean splits: Train={len(df_train)}, Val={len(df_val)}, Test={len(df_test)}")
        return df_train, df_val, df_test


def audit_leakage(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    patient_id_column: str | None = None,
) -> dict[str, Any]:
    """Audits splits to guarantee zero patient overlap and zero index overlap."""
    violations = []
    
    # 1. Index Overlap Check
    train_idx = set(train_df.index)
    val_idx = set(val_df.index)
    test_idx = set(test_df.index)

    if train_idx.intersection(val_idx):
        violations.append("Index overlap between train and val")
    if train_idx.intersection(test_idx):
        violations.append("Index overlap between train and test")
    if val_idx.intersection(test_idx):
        violations.append("Index overlap between val and test")

    # 2. Patient ID Overlap Check
    if patient_id_column and patient_id_column in train_df.columns:
        train_pts = set(train_df[patient_id_column].unique())
        val_pts = set(val_df[patient_id_column].unique())
        test_pts = set(test_df[patient_id_column].unique())

        tv_pts = train_pts.intersection(val_pts)
        if tv_pts:
            violations.append(f"{len(tv_pts)} patient(s) shared between train and val")
        tt_pts = train_pts.intersection(test_pts)
        if tt_pts:
            violations.append(f"{len(tt_pts)} patient(s) shared between train and test")
        vt_pts = val_pts.intersection(test_pts)
        if vt_pts:
            violations.append(f"{len(vt_pts)} patient(s) shared between val and test")

    passed = len(violations) == 0
    return {
        "passed": passed,
        "leakage_detected": not passed,
        "violations": violations,
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
    }
