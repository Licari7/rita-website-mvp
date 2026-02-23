import re
import os

filepath = r"c:\Users\Carlos\Antigravity\Webpage\dashboard.html"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove draggable="true" specifically from admin-card details
new_content = re.sub(r'(<details class="admin-card draggable-card.*?")\s+draggable="true"', r'\1', content)

# Also adding the missing drag-handle to the events card
events_card_match = r'<details class="admin-card draggable-card" id="card-events">\s*<summary class="admin-card-header">\s*<span>'
events_card_replace = '<details class="admin-card draggable-card" id="card-events">\n                    <summary class="admin-card-header">\n                        <div class="drag-handle"><i data-lucide="grip-vertical"></i></div>\n                        <span>'

new_content = re.sub(events_card_match, events_card_replace, new_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement successful")
