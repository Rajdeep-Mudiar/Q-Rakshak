import json
import re

def parse_log():
    log_path = 'C:/Users/Rajdeep/.gemini/antigravity-ide/brain/d0b5d2e5-6328-4d50-b2a2-61596c8e4dbf/.system_generated/tasks/task-1834.log'
    content = open(log_path, encoding='utf-8', errors='ignore').read()
    
    # Check feature statistics
    if "=== 4. FEATURE AND ANGLE SCALING STATISTICS ===" in content:
        stat_block = content.split("=== 4. FEATURE AND ANGLE SCALING STATISTICS ===")[1].split("=== STARTING CONTROLLED ABLATIONS")[0]
        print("Feature Scaling Stats:")
        print(stat_block.strip())
        
    run_splits = re.split(r'>>> Running ', content)
    
    results = []
    for run in run_splits[1:]:
        lines = run.strip().split('\n')
        run_name = lines[0].strip()
        
        metric_dicts = []
        for line in lines:
            if line.strip().startswith('{') and line.strip().endswith('}'):
                try:
                    js_str = line.replace("'", '"')
                    metric_dicts.append(json.loads(js_str))
                except Exception as e:
                    pass
        
        if not metric_dicts:
            continue
            
        best_epoch_dict = max(metric_dicts, key=lambda x: x['val_macro_f1'])
        
        # Extra details on df class performance if available
        results.append({
            "Experiment": run_name,
            "Best Epoch": best_epoch_dict['epoch'],
            "Accuracy": round(best_epoch_dict['val_accuracy'], 4),
            "Macro F1": round(best_epoch_dict['val_macro_f1'], 4),
            "Train Loss": round(best_epoch_dict['train_loss'], 4),
            "LR": best_epoch_dict['lr']
        })
        
    print("\nParsed Phase 2 Leaderboard:")
    headers = ["Experiment", "Best Epoch", "Accuracy", "Macro F1", "Train Loss", "LR"]
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join(["---"] * len(headers)) + " |")
    for r in results:
        print(f"| {r['Experiment']} | {r['Best Epoch']} | {r['Accuracy']:.4f} | {r['Macro F1']:.4f} | {r['Train Loss']:.4f} | {r['LR']} |")

if __name__ == "__main__":
    parse_log()
