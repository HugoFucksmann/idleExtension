const AttachedFiles = memo(({ files }) => {
    if (!files?.length) return null;

    return (
        <div style={styles.attachedFiles}>
        {files.map((file, i) => (
            <span key={i} style={styles.fileTag}>
            {file.split("/").pop().split("\\").pop()}
            </span>
        ))}
        </div>
    );
});


export default AttachedFiles