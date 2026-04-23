import { Activity } from 'lucide-react';
import Menubar from './Menubar';

const Header = () => {
  return (
    <header className="app-header">
      <div className="brand-logo">
        <Activity color="var(--accent-color)" size={28} />
        Industrial<span>IoT</span>
      </div>
      <Menubar />
    </header>
  );
};

export default Header;
