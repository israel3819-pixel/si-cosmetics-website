"""Run with: python scripts/check-seo.py [preview origin]; requires requests, beautifulsoup4."""
import sys,json,concurrent.futures
from pathlib import Path
from urllib.parse import urlsplit,urljoin
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
origin=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4173'
paths=['/','/mens-facial-tel-aviv','/laser-hair-removal-men','/spray-tan-tel-aviv','/acne-scars-treatment','/services/skin','/services/laser','/services/tan','/privacy/','/terms/','/accessibility/']
issues=[];rows=[];links=set()
for path in paths:
 r=requests.get(origin+path,timeout=30);s=BeautifulSoup(r.text,'html.parser')
 assert r.status_code==200,(path,r.status_code)
 assert 'noindex' in r.headers.get('X-Robots-Tag',''),path
 assert len(s.select('h1'))==1,path
 assert len(s.select('meta[name=description]'))==1,path
 assert len(s.select('link[rel=canonical]'))==1,path
 assert 'noindex' in s.select_one('meta[name=robots]')['content'],path
 for js in s.select('script[type="application/ld+json"]'):
  data=json.loads(js.string)
  for item in data.get('@graph',[]):
   if item['@type']=='FAQPage':
    for q in item['mainEntity']:
     assert q['name'] in s.get_text() and q['acceptedAnswer']['text'] in s.get_text()
   if item['@type']=='Service':assert item['provider']['@id']=='https://si-cosmetics.co.il/#business'
 for a in s.select('[href],img[src],script[src]'):
  url=urljoin(origin+path,a.get('href',a.get('src','')));u=urlsplit(url)
  if u.netloc==urlsplit(origin).netloc:links.add(url)
 rows.append({'path':path,'status':r.status_code,'noindex':True,'bytes':len(r.content)})
def check(url):
 r=requests.get(url.split('#')[0],timeout=30)
 if r.status_code!=200:return (url,r.status_code)
 frag=urlsplit(url).fragment
 if frag and not BeautifulSoup(r.text,'html.parser').find(id=frag):return (url,'missing fragment')
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:issues=[x for x in pool.map(check,links) if x]
assert not issues,issues
r=requests.get(origin+'/missing-seo-qa-page',timeout=30);assert r.status_code==404,r.status_code
r=requests.get(origin+'/sitemap.xml',timeout=30);xml=ET.fromstring(r.text);assert len(xml)==11
print(json.dumps({'origin':origin,'pages':rows,'internal_links_checked':len(links),'broken_links':issues,'sitemap_urls':len(xml),'missing_page_status':404},ensure_ascii=False,indent=2))
