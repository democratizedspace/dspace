import http.cookiejar, urllib.request
from pprint import pprint
from bs4 import BeautifulSoup

# define base URL
base_url = "https://democratized.space"

# function that gets a list of cookies from an http.cookiejar
def get_cookies(cj):
    cookies = []
    for c in cj:
        cookies.append(c.name + "=" + c.value)
    return cookies

# function called pretty_print_html that prints HTML with pretty indentation abd returns the prettified HTML
def pretty_print_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    prettified = soup.prettify()
    print(prettified)
    return prettified

# function called get_lines_containing_text that only returns lines containing the word "foo" in a multiline string
def get_lines_containing_text(text, lines):
    return [line for line in lines if text in line]

# function that extracts all the links from a HTML page
def get_links(html):
    soup = BeautifulSoup(html, 'html.parser')
    links = []
    for link in soup.find_all('a'):
        links.append(link.get('href'))
    return links

# function that visits a page at the given relative path and returns the HTML
def visit_page(relative_path):
    url = base_url + relative_path
    req = urllib.request.Request(url)
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    response = opener.open(req)
    html = response.read().decode('utf-8')
    links = get_links(html)
    cookies = get_cookies(cj)
    return html, links, cookies

# function that prints multiple string parameters along with the name of the variable
def print_parameters(*args):
    for arg in args:
        try:
            print(arg.__name__ + ": " + arg)
        except AttributeError:
            print(str(arg))

# function that visits a page and prints the HTML, links, and cookies and asks the user to navigate to a page. Returns the path.
def visit_page_and_navigate(relative_path):
    html, links, cookies = visit_page(relative_path)
    print_parameters(html, links, cookies)
    print("\n")
    print("Please navigate to a page and type the path of the page you want to visit.")
    path = input()
    return path

if __name__ == "__main__":
    next_page = "/"

    while True:
        # TODO: persist session to keep the cookies
        
        next_page = visit_page_and_navigate(next_page)