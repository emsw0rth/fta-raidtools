import './Title.css';

interface TitleProps {
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

function Title({ text, level = 1 }: TitleProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Tag className={`title title--h${level}`}>{text}</Tag>;
}

export default Title;
