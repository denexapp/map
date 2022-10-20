import classnames from "classnames";
import styles from "./styles.module.css";

export interface LayerProps {
  direction?: React.CSSProperties["flexDirection"];
  padding?: boolean;
}

const Layer: React.FC<React.PropsWithChildren<LayerProps>> = (props) => {
  const { children, padding, direction } = props;

  return (
    <div
      className={classnames(styles.layer, { [styles.padding]: padding })}
      style={{ flexDirection: direction }}
    >
      <div className={styles.childrenWrap}>
        {children}
      </div>
    </div>
  );
};

export default Layer;
