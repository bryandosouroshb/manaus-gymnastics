#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('public/stcontrol.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the duplicate section
start_line = None
end_line = None

for i, line in enumerate(lines):
    if 'EVENT LISTENERS DE BROADCAST' in line and i > 1700:
        start_line = i
    if start_line is not None and 'Event listeners para controles de display especiais' in line and i > start_line:
        end_line = i
        break

print(f"Found duplicate section from line {start_line} to {end_line}")

if start_line and end_line:
    # Remove lines from start_line to end_line-1
    new_lines = lines[:start_line] + lines[end_line:]
    
    with open('public/stcontrol.html', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Removed {end_line - start_line} duplicate lines")
else:
    print("Could not find duplicate section")
