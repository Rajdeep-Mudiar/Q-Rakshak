import json
import re

def main():
    log_path = 'C:/Users/Rajdeep/.gemini/antigravity-ide/brain/d0b5d2e5-6328-4d50-b2a2-61596c8e4dbf/.system_generated/tasks/task-1476.log'
    content = open(log_path, encoding='utf-8', errors='ignore').read()
    
    run_splits = re.split(r'>>> Running ', content)
    
    def parse_run(run_block):
        lines = run_block.split('\n')
        metric_dicts = []
        for line in lines:
            if line.strip().startswith('{') and line.strip().endswith('}'):
                try:
                    js_str = line.replace("'", '"')
                    metric_dicts.append(json.loads(js_str))
                except Exception as e:
                    pass
        return max(metric_dicts, key=lambda x: x['val_macro_f1']) if metric_dicts else None

    a_best = parse_run(run_splits[1])
    c_best = parse_run(run_splits[3])
    
    # We can retrieve confusion matrices or print details if available.
    # Note: the training loop row prints do not contain the confusion matrix, but let's check what they have.
    print("Run A best dict keys:", a_best.keys() if a_best else None)
    print("Run A val macro f1:", a_best['val_macro_f1'] if a_best else None)
    
if __name__ == "__main__":
    main()
