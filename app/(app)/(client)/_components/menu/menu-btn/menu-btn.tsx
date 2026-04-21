type MenuBtnProps = {
  isOpen: boolean;
  toggleMenu: () => void;
  isHidden?: boolean;
};

export default function MenuBtn({ isOpen, toggleMenu, isHidden = false }: MenuBtnProps) {
  return (
    <div
      className={`menu-toggle ${isOpen ? "opened" : "closed"} ${isHidden ? "menu-toggle-hidden" : ""}`}
      onClick={toggleMenu}
    >
      <div className="menu-toggle-icon">
        <div className="hamburger">
          <div className="menu-bar" data-position="top"></div>
          <div className="menu-bar" data-position="bottom"></div>
        </div>
      </div>
      <div className="menu-copy">
        <p>Menu</p>
      </div>
    </div>
  );
}
