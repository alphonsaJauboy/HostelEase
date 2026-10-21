
<?php

$allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174"
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/config/db.php';

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function output($data, $code = 200) {
    http_response_code($code);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($data);
    exit;
}

function input() {
    return json_decode(file_get_contents("php://input"), true) ?? [];
}

function requireLogin() {
    global $pdo;

    if (!isset($_SESSION['user'])) {
        output(["error" => "Please log in first"], 401);
    }

    $stmt = $pdo->prepare("
        SELECT is_active
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$_SESSION['user']['id']]);
    $account = $stmt->fetch();

    if (!$account || (int)$account['is_active'] !== 1) {
        $_SESSION = [];
        session_destroy();

        output([
            "error" => "Your account has been deactivated"
        ], 403);
    }

    return $_SESSION['user'];
}

function requireAdmin() {
    $user = requireLogin();

    if ($user['role'] !== 'admin') {
        output(["error" => "Administrator access required"], 403);
    }

    return $user;
}

// --------------------------------------------------
// ROOM TYPE CONFIGURATION
// --------------------------------------------------

function getRoomConfig() {
    return [
        "Single Sharing" => [
            "prefix" => "S",
            "capacity" => 1
        ],
        "Double Sharing" => [
            "prefix" => "D",
            "capacity" => 2
        ],
        "Triple Sharing" => [
            "prefix" => "T",
            "capacity" => 3
        ],
        "Four Sharing" => [
            "prefix" => "F",
            "capacity" => 4
        ]
    ];
}

// --------------------------------------------------
// CREATE MULTIPLE ROOMS
// --------------------------------------------------

function createRooms($pdo, $roomType, $quantity, $fee, $facilities) {

    $config = getRoomConfig();

    if (!isset($config[$roomType])) {
        throw new Exception("Invalid room type");
    }

    $prefix = $config[$roomType]['prefix'];
    $capacity = $config[$roomType]['capacity'];

    $stmt = $pdo->prepare("
        SELECT room_number
        FROM rooms
        WHERE room_number LIKE ?
    ");

    $stmt->execute([$prefix . "%"]);

    $maxNumber = 0;

    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $number) {
        if (preg_match(
            '/^' . preg_quote($prefix, '/') . '(\d+)$/',
            $number,
            $matches
        )) {
            $maxNumber = max($maxNumber, (int)$matches[1]);
        }
    }

    $insert = $pdo->prepare("
        INSERT INTO rooms
        (room_number, room_type, capacity, fee, facilities)
        VALUES (?, ?, ?, ?, ?)
    ");

    $createdRooms = [];

    for ($i = 1; $i <= $quantity; $i++) {

        $maxNumber++;

        $roomNumber = $prefix .
            str_pad($maxNumber, 3, "0", STR_PAD_LEFT);

        $insert->execute([
            $roomNumber,
            $roomType,
            $capacity,
            $fee,
            $facilities
        ]);

        $createdRooms[] = $roomNumber;
    }

    return $createdRooms;
}

$action = $_GET['action'] ?? '';
$data = input();

try {

    switch ($action) {

        // ==========================================
        // STUDENT REGISTRATION
        // ==========================================

        case 'register':

            $name = trim($data['full_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $pass = $data['password'] ?? '';

            if (
                !$name ||
                !filter_var($email, FILTER_VALIDATE_EMAIL) ||
                strlen($pass) < 6
            ) {
                output([
                    "error" => "Enter valid details. Password must have at least 6 characters."
                ], 422);
            }

            $stmt = $pdo->prepare("
                INSERT INTO users
                (
                    full_name,
                    email,
                    password,
                    role,
                    student_id,
                    phone,
                    department,
                    year_of_study
                )
                VALUES (?, ?, ?, 'student', ?, ?, ?, ?)
            ");

            $stmt->execute([
                $name,
                $email,
                password_hash($pass, PASSWORD_DEFAULT),
                $data['student_id'] ?? null,
                $data['phone'] ?? null,
                $data['department'] ?? null,
                $data['year_of_study'] ?? null
            ]);

            output([
                "message" => "Registration successful"
            ]);

            break;


        // ==========================================
        // LOGIN
        // ==========================================

        case 'login':

            $email = trim($data['email'] ?? '');
            $pass = $data['password'] ?? '';

            $stmt = $pdo->prepare("
                SELECT * FROM users WHERE email = ?
            ");

            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (
                !$user ||
                !password_verify($pass, $user['password'])
            ) {
                output([
                    "error" => "Invalid email or password"
                ], 401);
            }

            if ((int)$user['is_active'] !== 1) {
                output([
                    "error" => "Your account has been deactivated. Contact the administrator."
                ], 403);
            }

            session_regenerate_id(true);

            unset($user['password']);

            $_SESSION['user'] = $user;

            output([
                "message" => "Login successful",
                "user" => $user
            ]);

            break;


        // ==========================================
        // CURRENT USER
        // ==========================================

        case 'me':

            $user = requireLogin();

            output([
                "user" => $user
            ]);

            break;


        // ==========================================
        // LOGOUT
        // ==========================================

        case 'logout':

            $_SESSION = [];
            session_destroy();

            output([
                "message" => "Logged out successfully"
            ]);

            break;


        // ==========================================
        // VIEW ROOMS
        // PENDING + APPROVED APPLICATIONS RESERVE BEDS
        // ==========================================

        case 'rooms':

            $stmt = $pdo->query("
                SELECT
                    r.*,

                    (
                        SELECT COUNT(*)
                        FROM applications a
                        JOIN users u ON a.user_id = u.id
                        WHERE a.room_id = r.id
                        AND a.status IN ('Pending', 'Approved')
                        AND u.is_active = 1
                    ) AS occupied

                FROM rooms r
                ORDER BY r.room_number
            ");

            $rooms = $stmt->fetchAll();

            foreach ($rooms as &$room) {

                $room['capacity'] = (int)$room['capacity'];
                $room['occupied'] = (int)$room['occupied'];

                $room['available_beds'] = max(
                    0,
                    $room['capacity'] - $room['occupied']
                );
            }

            unset($room);

            output($rooms);

            break;


        // ==========================================
        // ADD MULTIPLE ROOMS
        // ==========================================

        case 'add_room':

            requireAdmin();

            $roomType = $data['room_type'] ?? '';
            $quantity = (int)($data['quantity'] ?? 0);
            $fee = (float)($data['fee'] ?? 0);
            $facilities = trim($data['facilities'] ?? '');

            if (!isset(getRoomConfig()[$roomType])) {
                output([
                    "error" => "Please select a valid room type"
                ], 422);
            }

            if ($quantity < 1 || $quantity > 100) {
                output([
                    "error" => "Quantity must be between 1 and 100"
                ], 422);
            }

            if ($fee <= 0) {
                output([
                    "error" => "Enter a valid monthly fee"
                ], 422);
            }

            $pdo->beginTransaction();

            $createdRooms = createRooms(
                $pdo,
                $roomType,
                $quantity,
                $fee,
                $facilities
            );

            $pdo->commit();

            output([
                "message" => count($createdRooms) .
                    " rooms added successfully",
                "rooms" => $createdRooms
            ]);

            break;


        // ==========================================
        // INCREASE ROOM QUANTITY
        // ==========================================

        case 'increase_room_quantity':

            requireAdmin();

            $roomType = $data['room_type'] ?? '';
            $quantity = (int)($data['quantity'] ?? 0);

            if (!isset(getRoomConfig()[$roomType])) {
                output([
                    "error" => "Invalid room type"
                ], 422);
            }

            if ($quantity < 1 || $quantity > 100) {
                output([
                    "error" => "Quantity must be between 1 and 100"
                ], 422);
            }

            $stmt = $pdo->prepare("
                SELECT fee, facilities
                FROM rooms
                WHERE room_type = ?
                ORDER BY id DESC
                LIMIT 1
            ");

            $stmt->execute([$roomType]);

            $existingRoom = $stmt->fetch();

            if (!$existingRoom) {
                output([
                    "error" => "No existing room of this type. Use Add New Room first."
                ], 404);
            }

            $pdo->beginTransaction();

            $createdRooms = createRooms(
                $pdo,
                $roomType,
                $quantity,
                $existingRoom['fee'],
                $existingRoom['facilities']
            );

            $pdo->commit();

            output([
                "message" => count($createdRooms) .
                    " rooms added successfully",
                "rooms" => $createdRooms
            ]);

            break;


        // ==========================================
        // DELETE ROOM
        // ==========================================

        case 'delete_room':

            requireAdmin();

            $roomId = (int)($data['room_id'] ?? 0);

            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM applications
                WHERE room_id = ?
                AND status = 'Approved'
            ");

            $stmt->execute([$roomId]);

            if ($stmt->fetchColumn() > 0) {
                output([
                    "error" => "Cannot delete a room with allocated students"
                ], 409);
            }

            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM applications
                WHERE room_id = ?
            ");

            $stmt->execute([$roomId]);

            if ($stmt->fetchColumn() > 0) {
                output([
                    "error" => "Cannot delete a room with existing applications"
                ], 409);
            }

            $stmt = $pdo->prepare("
                DELETE FROM rooms WHERE id = ?
            ");

            $stmt->execute([$roomId]);

            output([
                "message" => "Room deleted successfully"
            ]);

            break;


        // ==========================================
        // STUDENT APPLY FOR ROOM
        // PENDING APPLICATIONS RESERVE BEDS
        // ==========================================

        case 'apply':

            $user = requireLogin();

            if ($user['role'] !== 'student') {
                output([
                    "error" => "Students only"
                ], 403);
            }

            $roomId = (int)($data['room_id'] ?? 0);

            if ($roomId <= 0) {
                output([
                    "error" => "Please select a valid room"
                ], 422);
            }

            $pdo->beginTransaction();

            // Lock the room so simultaneous applications
            // cannot reserve the same last available bed.
            $stmt = $pdo->prepare("
                SELECT id, capacity
                FROM rooms
                WHERE id = ?
                FOR UPDATE
            ");

            $stmt->execute([$roomId]);

            $room = $stmt->fetch();

            if (!$room) {
                $pdo->rollBack();

                output([
                    "error" => "Room not found"
                ], 404);
            }

            // One active application per student.
            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM applications
                WHERE user_id = ?
                AND status IN ('Pending', 'Approved')
            ");

            $stmt->execute([$user['id']]);

            if ((int)$stmt->fetchColumn() > 0) {
                $pdo->rollBack();

                output([
                    "error" => "You already have a pending or approved application"
                ], 409);
            }

            // Count BOTH pending and approved applications.
            // Only active student accounts reserve beds.
            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM applications a
                JOIN users u ON a.user_id = u.id
                WHERE a.room_id = ?
                AND a.status IN ('Pending', 'Approved')
                AND u.is_active = 1
            ");

            $stmt->execute([$roomId]);

            $occupied = (int)$stmt->fetchColumn();

            if ($occupied >= (int)$room['capacity']) {
                $pdo->rollBack();

                output([
                    "error" => "This room is fully booked. Please select another room."
                ], 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO applications (user_id, room_id)
                VALUES (?, ?)
            ");

            $stmt->execute([
                $user['id'],
                $roomId
            ]);

            $pdo->commit();

            output([
                "message" => "Room application submitted successfully. Your bed is temporarily reserved until the administrator processes your application."
            ]);

            break;


        // ==========================================
        // CANCEL STUDENT APPLICATION
        // ==========================================

        case 'cancel_application':

            $user = requireLogin();

            if ($user['role'] !== 'student') {
                output([
                    "error" => "Students only"
                ], 403);
            }

            $applicationId = (int)($data['application_id'] ?? 0);

            if ($applicationId <= 0) {
                output([
                    "error" => "Invalid application ID"
                ], 422);
            }

            $stmt = $pdo->prepare("
                UPDATE applications
                SET status = 'Cancelled'
                WHERE id = ?
                AND user_id = ?
                AND status = 'Pending'
            ");

            $stmt->execute([
                $applicationId,
                $user['id']
            ]);

            if ($stmt->rowCount() !== 1) {
                output([
                    "error" => "Application not found or cannot be cancelled"
                ], 409);
            }

            output([
                "message" => "Application cancelled successfully"
            ]);

            break;


        // ==========================================
        // STUDENT APPLICATIONS
        // ==========================================

        case 'my_applications':

            $user = requireLogin();

            $stmt = $pdo->prepare("
                SELECT
                    a.*,
                    r.room_number,
                    r.room_type,
                    r.fee

                FROM applications a

                JOIN rooms r
                    ON a.room_id = r.id

                WHERE a.user_id = ?

                ORDER BY a.created_at DESC
            ");

            $stmt->execute([$user['id']]);

            output($stmt->fetchAll());

            break;


        // ==========================================
        // GET ALL REGISTERED STUDENTS
        // ==========================================

        case 'students':

            requireAdmin();

            $stmt = $pdo->query("
                SELECT
                    u.id,
                    u.full_name,
                    u.student_id,
                    u.email,
                    u.is_active,

                    (
                        SELECT r.room_number
                        FROM applications a
                        JOIN rooms r ON a.room_id = r.id
                        WHERE a.user_id = u.id
                        AND a.status = 'Approved'
                        ORDER BY a.created_at DESC
                        LIMIT 1
                    ) AS room_number

                FROM users u
                WHERE u.role = 'student'
                ORDER BY u.full_name
            ");

            output($stmt->fetchAll());

            break;


        // ==========================================
        // DEACTIVATE STUDENT ACCOUNT
        // ==========================================

        case 'deactivate_student':

            requireAdmin();

            $studentId = (int)($data['student_id'] ?? 0);

            if ($studentId <= 0) {
                output([
                    "error" => "Invalid student ID"
                ], 422);
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                SELECT id
                FROM users
                WHERE id = ?
                AND role = 'student'
                AND is_active = 1
                FOR UPDATE
            ");

            $stmt->execute([$studentId]);

            if (!$stmt->fetch()) {
                $pdo->rollBack();

                output([
                    "error" => "Student not found or already deactivated"
                ], 404);
            }

            // Cancel pending applications but preserve history.
            $stmt = $pdo->prepare("
                UPDATE applications
                SET status = 'Cancelled'
                WHERE user_id = ?
                AND status = 'Pending'
            ");

            $stmt->execute([$studentId]);

            // Deactivate the account.
            $stmt = $pdo->prepare("
                UPDATE users
                SET is_active = 0
                WHERE id = ?
                AND role = 'student'
            ");

            $stmt->execute([$studentId]);

            $pdo->commit();

            output([
                "message" => "Student account deactivated successfully"
            ]);

            break;


        // ==========================================
        // ALL APPLICATIONS FOR ADMIN
        // ==========================================

        case 'all_applications':

            requireAdmin();

            $stmt = $pdo->query("
                SELECT
                    a.*,
                    u.full_name,
                    u.email,
                    u.student_id,
                    r.room_number,
                    r.room_type,
                    r.capacity

                FROM applications a

                JOIN users u
                    ON a.user_id = u.id

                JOIN rooms r
                    ON a.room_id = r.id

                ORDER BY a.created_at DESC
            ");

            output($stmt->fetchAll());

            break;


        // ==========================================
        // APPROVE OR REJECT APPLICATION
        // ==========================================

        case 'update_application':

            requireAdmin();

            $id = (int)($data['application_id'] ?? 0);
            $status = $data['status'] ?? '';

            if (!in_array($status, ['Approved', 'Rejected'], true)) {
                output([
                    "error" => "Invalid application status"
                ], 422);
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                SELECT *
                FROM applications
                WHERE id = ?
                FOR UPDATE
            ");

            $stmt->execute([$id]);

            $application = $stmt->fetch();

            if (!$application || $application['status'] !== 'Pending') {
                $pdo->rollBack();

                output([
                    "error" => "Application not found or already processed"
                ], 409);
            }

            if ($status === 'Approved') {

                // Lock the student's account and verify it is active.
                $stmt = $pdo->prepare("
                    SELECT is_active
                    FROM users
                    WHERE id = ?
                    FOR UPDATE
                ");

                $stmt->execute([$application['user_id']]);

                $student = $stmt->fetch();

                if (!$student || (int)$student['is_active'] !== 1) {
                    $pdo->rollBack();

                    output([
                        "error" => "This student account is inactive"
                    ], 409);
                }

                // Lock the room before checking its capacity.
                $stmt = $pdo->prepare("
                    SELECT capacity
                    FROM rooms
                    WHERE id = ?
                    FOR UPDATE
                ");

                $stmt->execute([$application['room_id']]);

                $room = $stmt->fetch();

                // The current Pending application already reserves
                // one bed. Therefore, count Pending + Approved.
                $stmt = $pdo->prepare("
                    SELECT COUNT(*)
                    FROM applications a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.room_id = ?
                    AND a.status IN ('Pending', 'Approved')
                    AND u.is_active = 1
                ");

                $stmt->execute([$application['room_id']]);

                $reservedBeds = (int)$stmt->fetchColumn();

                // Do not use >= here: the current application
                // is already included in the reserved bed count.
                if (
                    !$room ||
                    $reservedBeds > (int)$room['capacity']
                ) {
                    $pdo->rollBack();

                    output([
                        "error" => "No available beds in this room"
                    ], 409);
                }
            }

            $stmt = $pdo->prepare("
                UPDATE applications
                SET status = ?, remarks = ?
                WHERE id = ?
                AND status = 'Pending'
            ");

            $stmt->execute([
                $status,
                $data['remarks'] ?? '',
                $id
            ]);

            if ($stmt->rowCount() !== 1) {
                $pdo->rollBack();

                output([
                    "error" => "Unable to update this application"
                ], 409);
            }

            $pdo->commit();

            output([
                "message" => "Application " . strtolower($status)
            ]);

            break;


        // ==========================================
        // DEMO PAYMENT
        // ==========================================

        case 'pay':

            $user = requireLogin();

            if ($user['role'] !== 'student') {
                output([
                    "error" => "Students only"
                ], 403);
            }

            $stmt = $pdo->prepare("
                SELECT r.fee
                FROM applications a

                JOIN rooms r
                    ON a.room_id = r.id

                WHERE a.user_id = ?
                AND a.status = 'Approved'

                ORDER BY a.created_at DESC
                LIMIT 1
            ");

            $stmt->execute([$user['id']]);

            $application = $stmt->fetch();

            if (!$application) {
                output([
                    "error" => "No approved room allocation found"
                ], 400);
            }

            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM payments
                WHERE user_id = ?
                AND status = 'Success'
            ");

            $stmt->execute([$user['id']]);

            if ($stmt->fetchColumn() > 0) {
                output([
                    "error" => "Demo fee has already been paid"
                ], 409);
            }

            $transaction = "HOSTEL" .
                time() .
                random_int(100, 999);

            $stmt = $pdo->prepare("
                INSERT INTO payments
                (user_id, amount, transaction_id, status)
                VALUES (?, ?, ?, 'Success')
            ");

            $stmt->execute([
                $user['id'],
                $application['fee'],
                $transaction
            ]);

            output([
                "message" => "Demo payment successful",
                "transaction_id" => $transaction,
                "amount" => $application['fee']
            ]);

            break;


        // ==========================================
        // PAYMENT HISTORY
        // ==========================================

        case 'payments':

            $user = requireLogin();

            if ($user['role'] === 'admin') {

                $stmt = $pdo->query("
                    SELECT
                        p.*,
                        u.full_name,
                        u.student_id

                    FROM payments p

                    JOIN users u
                        ON p.user_id = u.id

                    ORDER BY p.created_at DESC
                ");

                output($stmt->fetchAll());
            }

            $stmt = $pdo->prepare("
                SELECT *
                FROM payments
                WHERE user_id = ?
                ORDER BY created_at DESC
            ");

            $stmt->execute([$user['id']]);

            output($stmt->fetchAll());

            break;


        // ==========================================
        // ADMIN DASHBOARD STATISTICS
        // ==========================================

        case 'stats':

            requireAdmin();

            $stats = [];

            // Counts all registered student accounts.
            $stats['students'] = (int)$pdo->query("
                SELECT COUNT(*)
                FROM users
                WHERE role = 'student'
            ")->fetchColumn();

            $stats['rooms'] = (int)$pdo->query("
                SELECT COUNT(*)
                FROM rooms
            ")->fetchColumn();

            $stats['applications'] = (int)$pdo->query("
                SELECT COUNT(*)
                FROM applications
                WHERE status = 'Pending'
            ")->fetchColumn();

            // Counts approved allocations belonging to active students.
            $stats['approved'] = (int)$pdo->query("
                SELECT COUNT(*)
                FROM applications a
                JOIN users u ON a.user_id = u.id
                WHERE a.status = 'Approved'
                AND u.is_active = 1
            ")->fetchColumn();

            $stats['payments'] = (float)$pdo->query("
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'Success'
            ")->fetchColumn();

            output($stats);

            break;


        // ==========================================
        // INVALID ACTION
        // ==========================================

        default:

            output([
                "error" => "Invalid API action"
            ], 404);
    }

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($e->getCode() == 23000) {
        output([
            "error" => "This record already exists"
        ], 409);
    }

    error_log($e->getMessage());

    output([
        "error" => "Database operation failed"
    ], 500);

} catch (Exception $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    output([
        "error" => $e->getMessage()
    ], 422);
}
