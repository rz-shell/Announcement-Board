import { useEffect, useState } from 'react'
import './Navigation.css';
import logo from '../cpessLOGO.png';
import logo2 from '../ubLOGO.png';

const Navigation = () => {
  const [showFirstLogo, setShowFirstLogo] = useState(true);

  useEffect(() => {
    const listItems = document.querySelectorAll('.list');
    const indicator = document.querySelector('.indicator');
  
    listItems.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        listItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        indicator.style.transform = `translateX(${item.offsetLeft}px)`;
        indicator.style.width = `${item.offsetWidth}px`;
      });
  
      item.addEventListener('mouseleave', () => {
        const active = document.querySelector('.list.active');
        if (active) {
          indicator.style.transform = `translateX(${active.offsetLeft}px)`;
          indicator.style.width = `${active.offsetWidth}px`;
        }
      });
    });
  }, []);
  
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowFirstLogo(prev => !prev);
  }, 3000);

  return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark border border-black border-3 rounded-2">
    <div className="container-fluid">
      <a className="navbar-brand d-flex align-items-center" href="#">
        <div className="logo-crossfade-wrapper me-5">
          <img
            src={logo}
            alt="Logo 1"
            className={`crossfade-logo ${showFirstLogo ? 'visible' : ''}`}
          />
          <img
            src={logo2}
            alt="Logo 2"
            className={`crossfade-logo ${showFirstLogo ? '' : 'visible'}`}
          />
        </div>
        <span className="brand-text">
          CPESS <span className="hollow-text">UBAT</span>
        </span>
      </a>
    </div>
  </nav>
  )
}

export default Navigation