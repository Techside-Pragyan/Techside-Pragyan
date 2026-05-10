with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

with open('algorithnicmind.md', 'r', encoding='utf-16le') as f:
    other = f.read()

start_idx = other.find('Tech Stack')
if start_idx != -1:
    div_start = other.find('<div', start_idx)
    end_idx = other.find('GitHub Analytics', start_idx)
    
    tech_stack_content = other[div_start:end_idx].strip()
    
    last_div = tech_stack_content.rfind('</div>')
    if last_div != -1:
        tech_stack_content = tech_stack_content[:last_div + 6]
    
    m_start_idx = readme.find('## ??? Tech Stack')
    if m_start_idx == -1:
        m_start_idx = readme.find('Tech Stack')
        m_start_idx = readme.rfind('##', 0, m_start_idx)
        
    m_end_idx = readme.find('## ?? Currently Working On')
    if m_end_idx == -1:
        m_end_idx = readme.find('Currently Working On')
        m_end_idx = readme.rfind('##', 0, m_end_idx)

    if m_start_idx != -1 and m_end_idx != -1:
        new_readme = readme[:m_start_idx] + '## ??? Tech Stack & Tools\n\n' + tech_stack_content + '\n\n---\n\n' + readme[m_end_idx:]
        with open('README.md', 'w', encoding='utf-8') as f:
            f.write(new_readme)
        print('Success, len:', len(tech_stack_content))
    else:
        print('Failed README markers')
else:
    print('Failed Tech Stack marker')
