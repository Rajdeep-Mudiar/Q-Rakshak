import json
import re

def parse_log():
    log_path = 'C:/Users/Rajdeep/.gemini/antigravity-ide/brain/d0b5d2e5-6328-4d50-b2a2-61596c8e4dbf/.system_generated/tasks/task-1476.log'
    content = open(log_path, encoding='utf-8', errors='ignore').read()
    
    # Let's split by run marker
    run_splits = re.split(r'>>> Running ', content)
    
    # The first split contains verified focal loss and sampler prints
    header_info = run_splits[0]
    print(header_info)
    
    results = []
    
    # Parse each run
    for run in run_splits[1:]:
        lines = run.strip().split('\n')
        run_name = lines[0].strip()
        
        # Find all dictionary metric printouts
        metric_dicts = []
        for line in lines:
            if line.strip().startswith('{') and line.strip().endswith('}'):
                try:
                    # Replace single quotes with double quotes for JSON parsing
                    js_str = line.replace("'", '"')
                    metric_dicts.append(json.loads(js_str))
                except Exception as e:
                    pass
        
        if not metric_dicts:
            continue
            
        # Find the best epoch based on validation macro F1
        best_epoch_dict = max(metric_dicts, key=lambda x: x['val_macro_f1'])
        
        results.append({
            "Configuration": run_name,
            "Best Epoch": best_epoch_dict['epoch'],
            "Accuracy": round(best_epoch_dict['val_accuracy'], 4),
            "Macro F1": round(best_epoch_dict['val_macro_f1'], 4),
            "Train Loss": round(best_epoch_dict['train_loss'], 4),
            "LR": best_epoch_dict['lr']
        })
        
    print("\nParsed Ablation Leaderboard:")
    headers = ["Configuration", "Best Epoch", "Accuracy", "Macro F1", "Train Loss", "LR"]
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join(["---"] * len(headers)) + " |")
    for r in results:
        print(f"| {r['Configuration']} | {r['Best Epoch']} | {r['Accuracy']:.4f} | {r['Macro F1']:.4f} | {r['Train Loss']:.4f} | {r['LR']} |")

if __name__ == "__main__":
    parse_log()
