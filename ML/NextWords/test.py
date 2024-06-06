from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.initializers import Orthogonal

# Define the model
model = Sequential()

# Define the layer with Orthogonal initializer
model.add(Dense(64, kernel_initializer=Orthogonal(gain=1.0, seed=None), input_shape=(100,)))

# Compile the model
model.compile(optimizer='adam', loss='mse')

# Print the model summary
model.summary()
