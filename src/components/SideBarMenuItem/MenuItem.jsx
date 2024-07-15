export const MenuItem = ({ title, className, onClick, iconClassName }) => {
  return (
    // jsx-a11y/anchor-is-valid
    // eslint-disable-next-line
    <a title={title} onClick={onClick} className={className}>
      <i className={iconClassName} />
    </a>
  );
};
