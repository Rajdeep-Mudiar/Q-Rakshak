# Longitudinal Health Tracker & Trend Analysis

The Longitudinal Tracker enables clinicians to monitor chronic biomarkers across temporal visits, filtering noise through same-day averaging and linear regression.

---

## 📈 Mathematical Trend Computation

For time points $t_i$ and measurements $y_i$:

1. **Same-Day Aggregation**:
   $$\bar{y}(t) = \frac{1}{|K_t|} \sum_{k \in K_t} y_k$$

2. **Ordinary Least Squares (OLS) Linear Trend**:
   $$\text{Slope } \beta = \frac{\sum (t_i - \bar{t})(y_i - \bar{y})}{\sum (t_i - \bar{t})^2}$$

3. **Clinical Trend Direction**:
   - $\beta > +0.05$: Deteriorating / Rapidly Escalating Risk
   - $-0.05 \le \beta \le +0.05$: Stable Condition
   - $\beta < -0.05$: Improving Trajectory
