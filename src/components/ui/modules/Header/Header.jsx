import styles from './Header.module.scss';
import RollingText from './RollingText';

export default function Header({ brand = '照片墙', onOpenDirectory, active = false }) {
    return (
        <div className={styles.header}>
            <div className={styles.pill}>
                <RollingText className={styles.brand} hoverColor="#ffd479">
                    {brand}
                </RollingText>
                <button className={styles.directory} onClick={onOpenDirectory}>
                    <RollingText active={active} hoverColor="#7ee0ff">
                        主题目录
                    </RollingText>
                </button>
            </div>
        </div>
    );
}
