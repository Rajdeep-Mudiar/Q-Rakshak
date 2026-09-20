# Deterministic ESI Triage Engine Specification

The **Q-RAKSHAK Deterministic Triage Engine** implements the clinical Emergency Severity Index (ESI) version 4 algorithmic standard combined with machine-learning assisted vital sign validation.

---

## 1. Algorithmic Flowchart

```
                          [Patient Enters Triage]
                                     
                                     
                [Decision Point A: Requires Immediate Life-Saving
                            Intervention / Resuscitation?]
                                     
                    
                     YES                              NO
                                                     
               [ ESI 1]                  [Decision Point B: High-Risk
             Resuscitation                  Situation / Confused / Lethargic
                                              Severe Pain or Distress?]
                                                      
                                     
                                      YES                              NO
                                                                      
                                [ ESI 2]                 [Decision Point C: How many
                                 Emergent                   resources are anticipated?]
                                                                       
                                              
                                               Many (>= 2)             One (1)                 None (0)
                                                                                              
                                     [Vital Signs Check]           [ ESI 4]               [🟢 ESI 5]
                                     Are vitals in danger zone?   Semi-Urgent               Non-Urgent
                                              
                                     
                                      Danger           Normal
                                                      
                                [ ESI 2]        [🟡 ESI 3]
                                 Emergent           Urgent
```

---

## 2. Vital Sign Danger Thresholds (Decision Point C Step-Up)

If a patient requires $\ge 2$ resources but exhibits vital signs in the danger zone, the triage tier is escalated from **ESI 3** to **ESI 2**:

| Age Group | Heart Rate (bpm) | Respiratory Rate (bpm) | SpO2 (%) | Systolic BP (mmHg) |
|---|---|---|---|---|
| **< 3 months** | > 180 | > 50 | < 92% | < 65 |
| **3 mo – 3 yrs**| > 160 | > 40 | < 92% | < 70 |
| **3 yrs – 8 yrs**| > 140 | > 30 | < 92% | < 80 |
| **> 8 years / Adult** | > 100 or < 50 | > 20 or < 10 | < 92% | < 90 or > 180 |

---

## 3. Hospital Resource Definitions (ESI Standard)

### Counted Resources:
- **Labs**: Blood, urine, CSF, cardiac enzymes, cultures.
- **ECG**: Diagnostic 12-lead electrocardiogram.
- **Imaging**: X-ray, CT scan, MRI, Ultrasound.
- **IV Fluids**: Hydration bolus or continuous infusion.
- **IV / IM / Inhaled Meds**: Antibiotics, bronchodilators, analgesics.
- **Specialty Procedures**: Laceration repair, urinary catheterization, chest tube.

### NOT Counted as Resources:
- History & physical examination.
- Point-of-care fingerstick glucose test.
- Saline lock insertion without fluids.
- Oral medications or prescription writing.
- Tetanus immunization or simple wound dressing.

---

## 4. Multi-Organ Risk Synthesis

In addition to ESI categorization, the triage engine executes disease-specific predictive models to quantify multi-organ involvement:

$$\text{Risk}_{\text{composite}} = \sum_{k \in \mathcal{K}} w_k \cdot P_k(\text{Abnormal} \mid x)$$

Where $\mathcal{K} = \{\text{cardiovascular}, \text{pulmonary}, \text{neurological}, \text{metabolic}, \text{oncological}\}$.
The resulting risk vector drives dynamic organ highlight shaders on the 3D Anatomical Digital Twin.
