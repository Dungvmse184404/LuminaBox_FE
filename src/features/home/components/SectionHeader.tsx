import { Link } from "react-router-dom";

interface Props {
  id: string;
  title: string;
  to: string;
}

export function SectionHeader({ id, title, to }: Props) {
  return (
    <div className="flex items-end justify-between">
      <h2 id={id} className="font-serif text-xl font-black text-primary-dark">
        {title}
      </h2>
      <Link to={to} className="text-sm font-semibold text-primary hover:underline">
        Xem tất cả
      </Link>
    </div>
  );
}
