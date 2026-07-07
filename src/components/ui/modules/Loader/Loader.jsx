'use client';

import styles from './Loader.module.scss';

function Loader() {
    return (
        <div className={styles.loader}>
            <div className={styles.loader__text}>加载中…</div>
        </div>
    );
}

export default Loader;
