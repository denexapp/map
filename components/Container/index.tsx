import styles from "./styles.module.css";

const Container: React.FC<React.PropsWithChildren> = (props) => {
  const { children } = props;

  return <div className={styles.container}>{children}</div>;
};

export default Container;
