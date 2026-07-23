# Slopathon Karlsruhe 2026.07.23
# Contibution from Elias
# Membrane Eigenmode Clock for Minutes and Seconds
# Code from the Google AI mode copy pasted together

from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import scipy.special as test_bessel

# 1. Setup the figure window and text object container
fig, ax = plt.subplots(figsize=(6, 3), facecolor='#111111')
ax.axis('off')  # Hide axis borders, ticks, and labels

def rad2min(rad):
    deg = np.rad2deg(rad)
    minute = int((deg/360)*10)
    return minute

def generate_circular_chladni(n_diameters, m_rings, angle, resolution=500):
    # 1. Create a Cartesian grid
    x = np.linspace(-1, 1, resolution)
    y = np.linspace(-1, 1, resolution)
    X, Y = np.meshgrid(x, y)
    
    # 2. Convert Cartesian grid coordinates to Polar coordinates
    R = np.sqrt(X**2 + Y**2)
    Theta = np.arctan2(Y, X)
    
    # 3. Find the m-th root of the n-th Bessel function of the first kind
    # This ensures that the outer edge of the drum (R=1) acts as a fixed boundary node
    bessel_roots = test_bessel.jn_zeros(n_diameters, m_rings)
    k = bessel_roots[m_rings - 1] # Select the specific root for our ring mode
    
    # 4. Compute the standing wave displacement
    Z = test_bessel.jn(n_diameters, k * R) * np.cos(n_diameters * Theta)
    
    # Mask out coordinates outside the boundary radius of the circular drum (R > 1)
    Z[R > 1] = np.nan
    #Z[Z<0] = 0

    
    # Take the absolute value; values close to 0 represent nodal lines where sand settles
    #return ellipsoid_value*0.3+Z#np.abs(Z)
    # Rotation angle in radians (e.g., 45 degrees counter-clockwise)
    phi = angle
    
    # Rotate the theta grid field
    Angle = (Theta - phi + np.pi) % (2 * np.pi) - np.pi
    return  Angle*0.05+Z

# Generate pattern matrix data
pattern = generate_circular_chladni(1, 2, 3)

# Display matrix with inverted grayscale (dark background, white lines)
watchface = ax.imshow(pattern, cmap='twilight', extent=[-1, 1, -1, 1])

# Place a placeholder text element in the center of the blank canvas
time_text = ax.text(0.5, 0.5, '', 
                    horizontalalignment='center', 
                    verticalalignment='center', 
                    fontsize=16, 
                    fontweight='bold', 
                    color='#00FFCC', 
                    transform=ax.transAxes)

# 2. Define the frame update function called by the animation loop
def update_time(frame):
    # Fetch current system time and format it
    current_time = datetime.now()#.strftime("%H:%M:%S")
    
    # --- Configuration ---
    # n = number of nodal diameters (radial lines intersecting the center)
    # m = number of nodal rings (concentric circles, including the outer boundary)

    uhrzeit = [current_time.hour%12,current_time.minute]
    stunden = uhrzeit[0]
    minuten = uhrzeit[1]
    if minuten < 10:
        min10 = 0
        min1 = minuten[0]
    else:
        min10,min1 = divmod(minuten, 10)
        
    nodal_diameters = min10
    nodal_rings = min1
    angle = np.deg2rad(current_time.second*(360/60))

    # Generate pattern matrix data
    pattern = generate_circular_chladni(nodal_diameters, nodal_rings, angle)

    # Display matrix with inverted grayscale (dark background, white lines)
    watchface = ax.imshow(pattern, cmap='twilight', extent=[-1, 1, -1, 1])
    
    current_time = datetime.now().strftime("%H:%M:%S")
    time_text.set_text(current_time)
    
    return watchface,

# 3. Construct the persistent animation pipeline engine
# interval=1000 means it calls update_time every 1000ms (1 second)
# blit=True optimizes rendering by only updating parts of the frame that change
ani = animation.FuncAnimation(fig, update_time, interval=1000, blit=True)

# UI Cleanup
# --- Plotting Engine ---
plt.figure(figsize=(6, 6), facecolor='black')
ax = plt.subplot(111)
# UI Cleanup
ax.axis('off')
#plt.title(f"Uhrzeit ({nodal_diameters}:{nodal_rings}{rad2min(angle)})", color='white', fontsize=14)
plt.tight_layout()

# Display the final rendered visual
plt.show()