import laspy
import numpy as np

def write_ply(output_file, points, colors=None):
    with open(output_file, 'w') as f:
        f.write("ply\n")
        f.write("format ascii 1.0\n")
        f.write(f"element vertex {len(points)}\n")
        f.write("property float x\n")
        f.write("property float y\n")
        f.write("property float z\n")
        if colors is not None:
            f.write("property uchar red\n")
            f.write("property uchar green\n")
            f.write("property uchar blue\n")
        f.write("end_header\n")
        for i, point in enumerate(points):
            if colors is not None:
                color = colors[i]
                f.write(f"{point[0]} {point[1]} {point[2]} {color[0]} {color[1]} {color[2]}\n")
            else:
                f.write(f"{point[0]} {point[1]} {point[2]}\n")

# Read LAS file
input_las = "lasFile.las"  # Replace with your LAS file
output_ply = "your_file.ply"  # Replace with desired PLY file

las = laspy.read(input_las)

# Extract points
points = np.vstack((las.x, las.y, las.z)).transpose()

# Extract colors if present
if hasattr(las, 'red') and hasattr(las, 'green') and hasattr(las, 'blue'):
    colors = np.vstack((las.red, las.green, las.blue)).transpose()
    colors = (colors / 256).astype(np.uint8)  # Scale colors to 0-255
else:
    colors = None

# Write to PLY
write_ply(output_ply, points, colors)
print(f"Converted {input_las} to {output_ply}")
