from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_container = False
        self.div_depth = 0
        self.found_end_line = -1

    def handle_starttag(self, tag, attrs):
        if tag == 'div':
            for attr in attrs:
                if attr[0] == 'id' and attr[1] == 'dashboard-cards-container':
                    self.in_container = True
                    self.div_depth = 1
                    print(f"Found container start at line {self.getpos()[0]}")
                    return
            if self.in_container:
                self.div_depth += 1

    def handle_endtag(self, tag):
        if tag == 'div' and self.in_container:
            self.div_depth -= 1
            if self.div_depth == 0:
                self.in_container = False
                self.found_end_line = self.getpos()[0]
                print(f"Found container end at line {self.getpos()[0]}")

parser = MyHTMLParser()
with open("c:\\Users\\Carlos\\Antigravity\\Webpage\\dashboard.html", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        parser.feed(line)
