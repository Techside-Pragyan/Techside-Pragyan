import codecs

with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

with codecs.open('algorithnicmind.md', 'r', encoding='utf-16le') as f:
    other = f.read()

start_idx = other.find('Tech Stack')
if start_idx != -1:
    div_start = other.find('<div', start_idx)
    end_idx = other.find('GitHub Analytics', start_idx)
    
    # We want everything from div_start up to the closing </div> before the ---
    tech_stack_content = other[div_start:end_idx].strip()
    
    # Clean up any trailing '---' or '## ' that might have been caught
    last_div = tech_stack_content.rfind('</div>')
    if last_div != -1:
        tech_stack_content = tech_stack_content[:last_div + 6]
    
    my_start = '## ??? Tech Stack & Tools'
    my_end = '## ?? Currently Working On'

    m_start_idx = readme.find(my_start)
    m_end_idx = readme.find(my_end)

    if m_start_idx != -1 and m_end_idx != -1:
        new_readme = readme[:m_start_idx] + '## ??? Tech Stack & Tools\n\n' + tech_stack_content + '\n\n---\n\n' + readme[m_end_idx:]
        with open('README.md', 'w', encoding='utf-8') as f:
            f.write(new_readme)
        print('Success, len:', len(tech_stack_content))
    else:
        print('Failed README markers')
else:
    print('Failed Tech Stack marker')
